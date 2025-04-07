import React, { useState } from 'react';
import { FiSearch, FiMail, FiLock, FiUser, FiCheck, FiX, FiAlertCircle, FiPlus } from 'react-icons/fi';

// Import our new UI components
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Notification from '../components/Notification';

const UntitledUIShowcase = () => {
  const [notifications, setNotifications] = useState([]);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const addNotification = (type) => {
    const newNotification = {
      id: Date.now(),
      type,
      message: `This is a ${type} notification example`,
    };
    setNotifications([...notifications, newNotification]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(notifications => 
        notifications.filter(n => n.id !== newNotification.id)
      );
    }, 3000);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Untitled UI Showcase</h1>
        <p className="text-gray-600">A demonstration of the new UI components following Untitled UI design principles</p>
      </div>
      
      {/* Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-4 max-w-md">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            show={true}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Buttons Section */}
        <Card title="Buttons" description="Various button styles and variants">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Button Variants</h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="error">Error</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Button Sizes</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Button States</h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" isLoading>Loading</Button>
                <Button variant="primary" leftIcon={<FiPlus />}>With Icon</Button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Badges Section */}
        <Card title="Badges" description="Status indicators and labels">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Badge Variants</h4>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="gray">Gray</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="success">Success</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Badge Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="primary" size="sm">Small</Badge>
                <Badge variant="primary" size="md">Medium</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Badges with Icons</h4>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" leftIcon={<FiCheck size={12} />}>Completed</Badge>
                <Badge variant="error" leftIcon={<FiX size={12} />}>Rejected</Badge>
                <Badge variant="warning" leftIcon={<FiAlertCircle size={12} />}>Pending</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Form Inputs Section */}
        <Card title="Form Inputs" description="Various input field styles">
          <div className="space-y-4">
            <Input
              name="name"
              label="Name"
              placeholder="Enter your name"
              value={formValues.name}
              onChange={handleInputChange}
              leftIcon={<FiUser />}
              required
            />
            
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={formValues.email}
              onChange={handleInputChange}
              leftIcon={<FiMail />}
              hint="We'll never share your email with anyone else."
              required
            />
            
            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={formValues.password}
              onChange={handleInputChange}
              leftIcon={<FiLock />}
              error={formValues.password && formValues.password.length < 8 ? "Password must be at least 8 characters" : ""}
              required
            />
            
            <Input
              name="search"
              placeholder="Search..."
              leftIcon={<FiSearch />}
            />
            
            <Input
              name="disabled"
              label="Disabled Input"
              placeholder="This input is disabled"
              disabled
            />
            
            <div className="mt-6">
              <Button variant="primary" fullWidth>Submit Form</Button>
            </div>
          </div>
        </Card>
        
        {/* Notifications Section */}
        <Card title="Notifications" description="Alert and notification components">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Types</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="success" onClick={() => addNotification('success')}>Show Success</Button>
                <Button variant="error" onClick={() => addNotification('error')}>Show Error</Button>
                <Button variant="warning" onClick={() => addNotification('warning')}>Show Warning</Button>
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Static Examples</h4>
              
              <div className="bg-success-50 text-success-700 border border-success-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <FiCheckCircle className="h-5 w-5 text-success-500" />
                <p className="text-sm font-medium">This is a success notification</p>
              </div>
              
              <div className="bg-error-50 text-error-700 border border-error-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <FiAlertCircle className="h-5 w-5 text-error-500" />
                <p className="text-sm font-medium">This is an error notification</p>
              </div>
              
              <div className="bg-warning-50 text-warning-700 border border-warning-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <FiAlertCircle className="h-5 w-5 text-warning-500" />
                <p className="text-sm font-medium">This is a warning notification</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Cards Section */}
      <div className="mb-12">
        <Card title="Card Examples" description="Various card layouts and styles">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Simple Card" description="A basic card with title and description">
              <p className="text-gray-600">This is a simple card with some content. Cards can be used to group related information.</p>
            </Card>
            
            <Card title="Card with Footer" description="A card with a footer section">
              <p className="text-gray-600">This card includes a footer section that can contain actions or additional information.</p>
              
              <div className="mt-4">
                <Badge variant="primary">Featured</Badge>
              </div>
              
              <footer>
                <div className="flex justify-end space-x-3">
                  <Button variant="ghost" size="sm">Cancel</Button>
                  <Button variant="primary" size="sm">Save</Button>
                </div>
              </footer>
            </Card>
            
            <Card>
              <div className="h-32 bg-gray-100 -mx-6 -mt-6 mb-6 flex items-center justify-center">
                <div className="text-gray-400">Image Placeholder</div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Card with Image</h3>
              <p className="text-gray-600">This card includes an image at the top and no formal header section.</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium mr-2">
                      JD
                    </div>
                    <span className="text-sm text-gray-600">John Doe</span>
                  </div>
                  <span className="text-sm text-gray-500">2 days ago</span>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UntitledUIShowcase;
