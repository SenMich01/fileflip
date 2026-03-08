import { useState } from 'react'

export default function NotificationsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  const handleSave = () => {
    // Handle notification settings save
    console.log('Saving notification settings:', { emailNotifications, pushNotifications })
  }

  return (
    <div>
      <h1>Notification Settings</h1>
      <div>
        <label>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
          />
          Email Notifications
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={pushNotifications}
            onChange={(e) => setPushNotifications(e.target.checked)}
          />
          Push Notifications
        </label>
      </div>
      <button onClick={handleSave}>Save Settings</button>
    </div>
  )
}