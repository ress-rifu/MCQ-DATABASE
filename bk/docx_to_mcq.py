#!/usr/bin/env python3
import os
import re
import tempfile
import json
import base64
import zipfile
from PIL import Image
import io
import subprocess
import sys

def extract_images_from_docx(docx_file, output_dir):
    """Extract images from the DOCX file (which is a ZIP archive)"""
    try:
        with zipfile.ZipFile(docx_file, 'r') as zip_ref:
            # Find all image files in the archive
            for file_info in zip_ref.infolist():
                if file_info.filename.startswith('word/media/'):
                    # Extract the image file
                    image_data = zip_ref.read(file_info.filename)
                    # Get just the filename part
                    image_filename = os.path.basename(file_info.filename)
                    # Save to the output directory
                    with open(os.path.join(output_dir, image_filename), 'wb') as img_file:
                        img_file.write(image_data)
    except Exception as e:
        print(f"Error extracting images: {e}", file=sys.stderr)
        return False
    return True

def image_to_base64(image_path):
    """Convert an image file to base64 string"""
    try:
        if not os.path.exists(image_path):
            return ""
        
        # Open the image and resize if needed
        with Image.open(image_path) as img:
            # Optionally resize large images
            max_size = (800, 600)  # Maximum dimensions
            if img.width > max_size[0] or img.height > max_size[1]:
                img.thumbnail(max_size, Image.LANCZOS)
            
            # Convert to base64
            buffer = io.BytesIO()
            # Determine the format based on the file extension
            format_ext = os.path.splitext(image_path)[1].lower().lstrip('.')
            if format_ext not in ['jpg', 'jpeg', 'png', 'gif']:
                format_ext = 'png'  # Default to PNG for unknown formats
            
            # Save to buffer
            img.save(buffer, format=format_ext.upper())
            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            # Create data URL
            return f"data:image/{format_ext};base64,{img_str}"
    except Exception as e:
        print(f"Error converting image to base64: {e}", file=sys.stderr)
        return ""

def parse_latex_for_mcqs(latex_file, images_dir):
    """
    Reads the LaTeX line by line, searching for the structure of both pattern types:

    Pattern 1 (General MCQ):
        {Serial}. {Question text} 
        [টপিক: {Topic}]
        [Difficulty]
        [Board/Institute info]
        ক. {Option A}
        খ. {Option B}
        গ. {Option C}
        ঘ. {Option D}
        উত্তরঃ [Answer]
        [Hint: {Hint}]
        [Explaination: {Explanation}]

    Pattern 2 (MCQs with multiple choice answers):
        {Serial}. {Question text with statements i, ii, iii} 
        [টপিক: {Topic}]
        [Difficulty]
        [Board/Institute info]
        নিচের কোনটি সঠিক?
        ক. {Option A}
        খ. {Option B}
        গ. {Option C}
        ঘ. {Option D}
        উত্তরঃ [Answer]
        [Hint: {Hint}]
        [Explaination: {Explanation}]

    Returns a list of rows for the final spreadsheet.
    """

    with open(latex_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Print first few lines for debugging
    print("First few lines of the latex file:")
    for i, line in enumerate(lines[:10]):
        print(f"Line {i+1}: {line.strip()}")

    # Regex for "Serial. question" - Bengali numerals
    re_question_bn = re.compile(r'^([০-৯]+)[.,)।]\s*(.*)', re.UNICODE)
    # Regex for "Serial. question" - English numerals
    re_question_en = re.compile(r'^(\d+)[.,)।]\s*(.*)', re.UNICODE)
    # Regex for options: "ক. ..."
    re_option = re.compile(r'^([ক-ঘ])[.)]\s+(.*)$', re.UNICODE)
    # Regex for answer: "উত্তরঃ ..."
    re_answer = re.compile(r'^উত্তর[:ঃ]\s+(.*)$', re.UNICODE)
    # Regex for explanation: "[Explaination: ...]"
    re_explanation = re.compile(r'\[Explaination:\s+(.*?)(?:\]|$)', re.UNICODE)
    # Regex for hint: "[Hint: ...]"
    re_hint = re.compile(r'\[Hint:\s+(.*?)(?:\]|$)', re.UNICODE)
    
    # Updated regex patterns for topic, difficulty, and board/institute
    # Regex for difficulty: "[Easy]", "[Medium]", "[Hard]", or any text in brackets
    re_difficulty = re.compile(r'\[(Easy|Medium|Hard|.*?Difficulty.*?)\]', re.UNICODE | re.IGNORECASE)
    # Regex for board/institute: "[Board-Year]" or any text containing "Board" in brackets
    re_board = re.compile(r'\[(.*?(?:Board|Institute|Reference).*?)\]', re.UNICODE | re.IGNORECASE)
    # Regex for topic: "[টপিক: ...]" or any text starting with "Topic:" in brackets
    re_topic = re.compile(r'\[(?:টপিক[:ঃ]|Topic:)\s+(.*?)(?:\]|$)', re.UNICODE | re.IGNORECASE)
    # Alternative topic pattern (just in brackets)
    re_topic_alt = re.compile(r'\[(.*?(?:Topic|Subject|Chapter).*?)\]', re.UNICODE | re.IGNORECASE)
    
    # Updated specific pattern for Bengali topics - with non-greedy matching to get full content
    re_topic_bengali = re.compile(r'\[টপিক[:ঃ]\s+([\s\S]*?)\]', re.UNICODE)
    
    # Regex for image inclusion
    re_image = re.compile(r'\\includegraphics(?:\[.*?\])?\{(.*?)\}')
    # Regex for multiple choice statements (i, ii, iii)
    re_statement = re.compile(r'(?:^|\n)\s*(i{1,3})\.\s*(.*?)(?=$|\n\s*i{1,3}\.|\n\s*নিচের)', re.UNICODE | re.DOTALL)
    # Regex for "নিচের কোনটি সঠিক?" to detect Pattern 2
    re_which_correct = re.compile(r'নিচের\s+কোনটি\s+সঠিক\s*\?', re.UNICODE)

    mcq_data = []

    # First pass: collect all lines into a single text
    full_text = " ".join([line.strip() for line in lines if line.strip()])
    
    # Print first 100 characters for debugging
    print(f"Full text first 100 chars: {full_text[:100]}")
    
    # Search for Bengali numerals in the text to confirm they exist
    bengali_digits_pattern = re.compile(r'[০-৯]+')
    bengali_matches = bengali_digits_pattern.findall(full_text)
    if bengali_matches:
        print(f"Found Bengali digits in text: {', '.join(bengali_matches[:10])}")
    else:
        print("No Bengali digits found in the text")
    
    # More robust pattern for Bengali serial numbers with various separators
    bengali_serial_pattern = r'(?:^|\s)([০-৯]+)[\.|\,|\)|।|:|\\]?[\s]*'
    
    # Try pattern matching with Bengali digits first (priority)
    mcq_blocks = re.split(bengali_serial_pattern, full_text)
    
    # If no MCQs found or very few, try with English digits
    if len(mcq_blocks) <= 3:  # Only the original text or just one MCQ found
        print("Few or no Bengali digit MCQs found, trying with English digits...")
        mcq_blocks = re.split(r'(?:^|\s)(\d+)[\.|\,|\)|।|:|\\]?[\s]*', full_text)
    
    # If still no MCQs found, try with even more flexible pattern
    if len(mcq_blocks) <= 3:
        print("Still few or no MCQs found, trying with an even more flexible pattern...")
        # This pattern allows for more variations in separators and spacing
        combined_pattern = r'(?:^|\s)([০-৯\d]+)[\.|\,|\)|।|:|\\]?[\s]*'
        mcq_blocks = re.split(combined_pattern, full_text)
    
    print(f"Found {(len(mcq_blocks)-1)//2} potential MCQ blocks")
    
    # Debug first block if available
    if len(mcq_blocks) > 2:
        print(f"First MCQ serial: {mcq_blocks[1]}")
        print(f"First MCQ content (first 100 chars): {mcq_blocks[2][:100]}...")
    
    # Check if any of the serial numbers are Bengali digits
    bengali_serials = 0
    english_serials = 0
    for i in range(1, len(mcq_blocks), 2):
        if i < len(mcq_blocks):
            if re.match(r'[০-৯]+', mcq_blocks[i]):
                bengali_serials += 1
            elif re.match(r'\d+', mcq_blocks[i]):
                english_serials += 1
    
    print(f"Detected {bengali_serials} Bengali serial numbers and {english_serials} English serial numbers")
    
    # Process each MCQ block
    i = 1
    while i < len(mcq_blocks):
        # Get serial number and question text
        serial_number = mcq_blocks[i]
        question_text = mcq_blocks[i+1] if i+1 < len(mcq_blocks) else ""
        
        # Skip if no question text
        if not question_text.strip():
            i += 2
            continue
            
        print(f"Processing MCQ with serial: {serial_number}")
        
        # Check if it's a Bengali serial number and display equivalent English number
        if re.match(r'[০-৯]+', serial_number):
            # Convert Bengali digits to English
            english_serial = ''
            bengali_to_english = {'০':'0', '১':'1', '২':'2', '৩':'3', '৪':'4', 
                                 '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9'}
            for digit in serial_number:
                english_serial += bengali_to_english.get(digit, digit)
            print(f"  Bengali serial {serial_number} = English serial {english_serial}")
        
        # Reset variables for new MCQ
        board_institute = ""
        topic = ""
        difficulty = ""
        question_img = ""
        options = {"ক": "", "খ": "", "গ": "", "ঘ": ""}
        options_img = {"ক": "", "খ": "", "গ": "", "ঘ": ""}
        answer = ""
        explanation = ""
        explanation_img = ""
        hint = ""
        hint_img = ""
        is_pattern2 = False
        
        # Check if it's Pattern 2 (has multiple choice statements)
        if re_which_correct.search(question_text):
            is_pattern2 = True
            print(f"MCQ {serial_number} is Pattern 2 (multiple choice)")
        
        # Extract images from question text
        img_matches = re_image.findall(question_text)
        if img_matches:
            for img_path in img_matches:
                # Extract just the filename part
                img_filename = os.path.basename(img_path)
                # Construct full path to the extracted image
                full_img_path = os.path.join(images_dir, img_filename)
                
                if os.path.exists(full_img_path):
                    question_img = image_to_base64(full_img_path)
                    # Once we have a question image, we can break
                    break
            
            # Remove image references from text
            question_text = re_image.sub('', question_text)
        
        # Extract topic from the question text - try both patterns
        # First try the Bengali-specific pattern
        topic_match = re_topic_bengali.search(question_text)
        if topic_match:
            topic = topic_match.group(1).strip()
            print(f"Found topic (Bengali pattern): {topic}")
        else:
            # Try general topic pattern
            topic_match = re_topic.search(question_text)
            if topic_match:
                topic = topic_match.group(1).strip()
                print(f"Found topic (primary pattern): {topic}")
            else:
                # Try alternative topic pattern
                topic_alt_match = re_topic_alt.search(question_text)
                if topic_alt_match:
                    topic = topic_alt_match.group(1).strip()
                    print(f"Found topic (alternative pattern): {topic}")
        
        # Extract difficulty from the question text
        difficulty_match = re_difficulty.search(question_text)
        if difficulty_match:
            difficulty = difficulty_match.group(1).strip()
            print(f"Found difficulty: {difficulty}")
        
        # Extract board/institute from the question text
        board_match = re_board.search(question_text)
        if board_match:
            board_institute = board_match.group(1).strip()
            print(f"Found board/institute: {board_institute}")
        
        # Extract hint from the question text
        hint_match = re_hint.search(question_text)
        if hint_match:
            hint = hint_match.group(1).strip()
            print(f"Found hint of length: {len(hint)}")
            
            # Look for images in the hint text
            hint_img_matches = re_image.findall(hint)
            if hint_img_matches:
                for img_path in hint_img_matches:
                    img_filename = os.path.basename(img_path)
                    full_img_path = os.path.join(images_dir, img_filename)
                    
                    if os.path.exists(full_img_path):
                        hint_img = image_to_base64(full_img_path)
                        break
                
                # Remove image references from hint
                hint = re_image.sub('', hint)
        
        # Extract explanation from the question text
        explanation_match = re_explanation.search(question_text)
        if explanation_match:
            explanation = explanation_match.group(1).strip()
            print(f"Found explanation of length: {len(explanation)}")
            
            # Look for images in the explanation text
            exp_img_matches = re_image.findall(explanation)
            if exp_img_matches:
                for img_path in exp_img_matches:
                    img_filename = os.path.basename(img_path)
                    full_img_path = os.path.join(images_dir, img_filename)
                    
                    if os.path.exists(full_img_path):
                        explanation_img = image_to_base64(full_img_path)
                        break
                
                # Remove image references from explanation
                explanation = re_image.sub('', explanation)
        
        # Try to find options with two different patterns
        option_found = False
        for option_letter in ["ক", "খ", "গ", "ঘ"]:
            # Pattern 1: Look for options like "ক. Option text"
            option_pattern1 = re.compile(rf"{option_letter}\.\s+(.*?)(?=\s+[ক-ঘ]\.|উত্তর[:ঃ]|\[Hint:|\[Explaination:|$)", re.DOTALL)
            option_match = option_pattern1.search(question_text)
            
            # Pattern 2: Look for options like "ক) Option text" or "ক অপশন টেক্সট"
            if not option_match:
                option_pattern2 = re.compile(rf"{option_letter}[\)।\s]\s*(.*?)(?=\s+[ক-ঘ][\)।\s]|উত্তর[:ঃ]|\[Hint:|\[Explaination:|$)", re.DOTALL)
                option_match = option_pattern2.search(question_text)
            
            if option_match:
                option_found = True
                option_text = option_match.group(1).strip()
                print(f"Found option {option_letter}: {option_text[:20]}...")
                
                # Look for images in the option text
                opt_img_matches = re_image.findall(option_text)
                if opt_img_matches:
                    for img_path in opt_img_matches:
                        img_filename = os.path.basename(img_path)
                        full_img_path = os.path.join(images_dir, img_filename)
                        
                        if os.path.exists(full_img_path):
                            options_img[option_letter] = image_to_base64(full_img_path)
                            break
                    
                    # Remove image references from option text
                    option_text = re_image.sub('', option_text)
                
                options[option_letter] = option_text
        
        # Skip this MCQ if no options found
        if not option_found:
            print(f"Warning: No options found for MCQ {serial_number}, skipping")
            i += 2
            continue
        
        # Extract answer from the question text - try multiple patterns
        answer_match = re.search(r'উত্তর[:ঃ]\s+(.*?)(?=\s+\[|$)', question_text)
        if not answer_match:
            answer_match = re.search(r'[Aa]nswer[:ঃ]\s+(.*?)(?=\s+\[|$)', question_text)
        
        if answer_match:
            answer = answer_match.group(1).strip()
            print(f"Found answer: {answer}")
        else:
            print(f"Warning: No answer found for MCQ {serial_number}")
        
        # Clean up the question text by removing extracted parts
        cleaned_question = question_text
        # Remove topic - both patterns
        cleaned_question = re.sub(r'\[(?:টপিক[:ঃ]|Topic:)\s+.*?\]', '', cleaned_question, flags=re.IGNORECASE)
        cleaned_question = re.sub(r'\[(.*?(?:Topic|Subject|Chapter).*?)\]', '', cleaned_question, flags=re.IGNORECASE)
        # Remove difficulty
        cleaned_question = re.sub(r'\[(Easy|Medium|Hard|.*?Difficulty.*?)\]', '', cleaned_question, flags=re.IGNORECASE)
        # Remove board/institute
        cleaned_question = re.sub(r'\[(.*?(?:Board|Institute|Reference).*?)\]', '', cleaned_question, flags=re.IGNORECASE)
        # Remove options
        for option_letter in ["ক", "খ", "গ", "ঘ"]:
            cleaned_question = re.sub(rf"{option_letter}[.)]\s+.*?(?=\s+[ক-ঘ][.)]|উত্তর[:ঃ]|\[Hint:|\[Explaination:|$)", '', cleaned_question, flags=re.DOTALL)
        # Remove answer
        cleaned_question = re.sub(r'উত্তর[:ঃ]\s+.*?(?=\s+\[|$)', '', cleaned_question)
        cleaned_question = re.sub(r'[Aa]nswer[:ঃ]\s+.*?(?=\s+\[|$)', '', cleaned_question)
        # Remove hint
        cleaned_question = re.sub(r'\[Hint:\s+.*?\]', '', cleaned_question)
        # Remove explanation
        cleaned_question = re.sub(r'\[Explaination:\s+.*?\]', '', cleaned_question)
        # Remove the "নিচের কোনটি সঠিক?" text for pattern 2
        if is_pattern2:
            cleaned_question = re.sub(r'নিচের\s+কোনটি\s+সঠিক\s*\?', '', cleaned_question)
        
        # Clean up any excessive whitespace
        if is_pattern2:
            # For pattern 2, preserve newlines but replace multiple spaces with single space
            cleaned_question = re.sub(r' +', ' ', cleaned_question).strip()
            # Make sure there are no more than 2 consecutive newlines
            cleaned_question = re.sub(r'\n{3,}', '\n\n', cleaned_question)
        else:
            # For pattern 1, replace all whitespace with single space
            cleaned_question = re.sub(r'\s+', ' ', cleaned_question).strip()
        
        # Update question text with the cleaned version
        question_text = cleaned_question
        print(f"Cleaned question (first 50 chars): {question_text[:50]}...")
        
        # Clean up LaTeX commands
        question_text = clean_latex_commands(question_text)
        topic = clean_latex_commands(topic)
        board_institute = clean_latex_commands(board_institute)
        hint = clean_latex_commands(hint)
        explanation = clean_latex_commands(explanation)
        for k in options.keys():
            options[k] = clean_latex_commands(options[k])
        
        # Convert Bengali answer to English (ক -> A, খ -> B, etc.)
        option_map = {"ক": "A", "খ": "B", "গ": "C", "ঘ": "D"}
        answer_eng = ""
        for bn_letter in answer:
            if bn_letter in option_map:
                answer_eng += option_map[bn_letter]
        
        # If we successfully mapped the answer, use it; otherwise keep original
        if answer_eng:
            answer = answer_eng
        
        # Add the MCQ to our data
        mcq_obj = {
            "Serial": serial_number.strip(),
            "Question": question_text.strip(),
            "Ques_img": question_img,
            "Topic": topic.strip(),
            "Difficulty_level": difficulty.strip(),
            "Reference_Board/Institute": board_institute.strip(),
            "OptionA": options["ক"].strip(),
            "OptionA_IMG": options_img["ক"],
            "OptionB": options["খ"].strip(),
            "OptionB_IMG": options_img["খ"],
            "OptionC": options["গ"].strip(),
            "OptionC_IMG": options_img["গ"],
            "OptionD": options["ঘ"].strip(),
            "OptionD_IMG": options_img["ঘ"],
            "Answer": answer.strip(),
            "Explaination": explanation.strip(),
            "Explaination_IMG": explanation_img,
            "Hint": hint.strip(),
            "Hint_img": hint_img
        }
        
        mcq_data.append(mcq_obj)
        print(f"Successfully added MCQ {serial_number} to dataset")
        
        # Move to the next block
        i += 2

    return mcq_data

def clean_latex_commands(text):
    """
    Cleans up potentially problematic LaTeX commands but preserves $ signs
    and the math content in pure linear format (like MS Word).
    """
    if not text:
        return text
        
    # First, temporarily protect special LaTeX commands that use $ internally
    text = text.replace(r'$\neq$', '__SPECIAL_NEQ__')
    
    # Replace LaTeX equation delimiters \( and \) with $ signs
    text = re.sub(r'\\(\(|\))', '$', text)
    
    # Fix adjacent $ signs (might happen with $$ in the middle)
    text = re.sub(r'\${2,}', '$', text)
    
    # Handle specific case for system of equations with braces (like in the example image)
    # $\left.\ \begin{matrix}-\frac{1}{2}x+y&=-1\\x-2y&=2\\\end{matrix}\right\}$
    system_pattern = r'\\left\.\s*\\begin\{matrix\}(.*?)\\end\{matrix\}\\right\\}'
    if re.search(system_pattern, text, re.DOTALL):
        # Keep this format as is - it's already in the desired linear format with braces
        pass
    else:
        # Handle other LaTeX for system of equations in linear format
        # Convert any matrix or array environment to linear equations
        text = re.sub(r'\\left\\{.*?\\begin\{(matrix|array).*?\}(.*?)\\end\{\1.*?\}', 
                     lambda m: linearize_equation_system(m.group(2)), text, flags=re.DOTALL)
    
    # Handle common LaTeX environments that might be in the text but preserve their content
    text = re.sub(r'\\begin\{(equation|align|gather|eqnarray)\*?\}(.*?)\\end\{\1\*?\}', 
                 lambda m: f'${m.group(2).strip()}$', text, flags=re.DOTALL)
    
    # Clean up some excessive whitespace in equations
    text = re.sub(r'\$\s+', '$', text)
    text = re.sub(r'\s+\$', '$', text)
    
    # Handle the specific case from the example
    # For example: $\frac{a_{1}}{a_{2}} = \frac{b_{1}}{b_{2}} $\neq$ \frac{c_{1}}{c_{2}}$
    text = re.sub(r'\$([^$]*?) \$\\neq\$ ([^$]*?)\$', r'$\1 \\neq \2$', text)
    
    # Remove \textbf and similar LaTeX markup tags
    text = re.sub(r'\\textbf\{([^}]*?)\}', r'\1', text)
    text = re.sub(r'\\textit\{([^}]*?)\}', r'\1', text)
    text = re.sub(r'\\emph\{([^}]*?)\}', r'\1', text)
    
    # Remove extra brackets around normal text
    text = re.sub(r'\{\[}([^{}\[\]]*?)\{\]}', r'\1', text)
    text = re.sub(r'\textbf\{\{([^{}]*?)\}\}', r'\1', text)
    
    # Handle the specific bracket pattern from the example
    # \textbf{{[}}টপিক\textbf{:} ... \textbf{{]}}
    text = re.sub(r'\\textbf\{\{\[}}(.*?)\\textbf\{\{\]}}', r'[\1]', text)
    text = re.sub(r'\\textbf\{:\}', r':', text)
    text = re.sub(r'\\textbf\{\?}', r'?', text)
    
    # Remove extra brackets that might interfere with equation display
    text = re.sub(r'\{\\\[}(.*?)\{\\\]}', r'\1', text)
    text = re.sub(r'\{\\(.*?)\\}', r'\1', text)
    
    # Restore protected special commands
    text = text.replace('__SPECIAL_NEQ__', r'\neq')
    
    # Clean up slashes before and after equation delimiters
    # Remove unnecessary backslashes and forward slashes before $
    text = re.sub(r'[\/\\]+\s*\$', ' $', text)
    # Remove unnecessary backslashes and forward slashes after $
    text = re.sub(r'\$\s*[\/\\]+', '$ ', text)
    
    # Add spaces before and after every equation if not already present
    # First, find all equation patterns (text between $ signs)
    equation_pattern = re.compile(r'(\$[^$]+?\$)')
    
    # Function to add spaces only if needed
    def add_spaces_to_eq(match):
        eq = match.group(1)
        # Check for spaces before and after
        prefix = ' ' if not eq.startswith(' $') else ''
        suffix = ' ' if not eq.endswith('$ ') else ''
        return f"{prefix}{eq}{suffix}"
        
    # Apply the spacing function
    text = equation_pattern.sub(add_spaces_to_eq, text)
    
    # Fix any cases where we might have added too many spaces
    text = re.sub(r'\s{2,}', ' ', text)
    
    return text.strip()

def linearize_equation_system(matrix_content):
    """
    Convert a LaTeX matrix/array representation of a system of equations
    to a linear format like MS Word would display.
    
    Example:
    Input: -\frac{1}{2}x+y&=-1\\x-2y&=2
    Output: -\frac{1}{2}x+y=-1, x-2y=2
    """
    # Replace newline markers with commas
    linear = re.sub(r'\\\\', ', ', matrix_content)
    
    # Replace alignment markers with appropriate symbols
    linear = re.sub(r'&=', '=', linear)
    linear = re.sub(r'&<', '<', linear)
    linear = re.sub(r'&>', '>', linear)
    
    return linear

def process_docx_file(docx_file, class_name, subject_name):
    """Process a DOCX file to extract MCQs"""
    mcq_data = []
    
    try:
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as tmpdir:
            print(f"Created temporary directory: {tmpdir}")
            
            # Extract DOCX contents (it's a ZIP file)
            images_dir = os.path.join(tmpdir, "media")
            os.makedirs(images_dir, exist_ok=True)
            
            # Extract images from DOCX
            extract_images_from_docx(docx_file, images_dir)
            print(f"Extracted images to {images_dir}")
            
            # Convert docx -> .tex using pandoc
            tex_path = os.path.join(tmpdir, "converted.tex")
            cmd = ["pandoc", docx_file, "-o", tex_path]
            print(f"Running pandoc command: {' '.join(cmd)}")
            
            try:
                result = subprocess.run(cmd, check=True, capture_output=True, text=True)
                print("Pandoc conversion completed.")
            except subprocess.CalledProcessError as e:
                print(f"Pandoc command failed with error: {e}")
                print(f"Error output: {e.stderr}")
                return {"error": f"Failed to convert DOCX file: {e.stderr}"}
            
            if not os.path.exists(tex_path) or os.path.getsize(tex_path) == 0:
                print("Error: Generated .tex file is empty or doesn't exist.")
                return {"error": "Pandoc failed to generate a proper .tex file"}
            
            # Parse the generated .tex for MCQs
            mcq_data = parse_latex_for_mcqs(tex_path, images_dir)
            
            # Add class and subject to each MCQ
            for mcq in mcq_data:
                mcq["Class"] = class_name
                mcq["Subject"] = subject_name
                mcq["Chapter"] = mcq.get("Topic", "")  # Use Topic as Chapter if not specified
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Error processing DOCX file: {str(e)}"}
    
    return {"mcqs": mcq_data}

if __name__ == "__main__":
    # This block executes when the script is run directly
    if len(sys.argv) < 4:
        print("Usage: python docx_to_mcq.py <docx_file> <class_name> <subject_name>")
        sys.exit(1)
    
    docx_file = sys.argv[1]
    class_name = sys.argv[2]
    subject_name = sys.argv[3]
    
    result = process_docx_file(docx_file, class_name, subject_name)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        sys.exit(1)
    
    print(json.dumps(result["mcqs"], indent=2))
    print(f"Successfully extracted {len(result['mcqs'])} MCQs from {docx_file}") 