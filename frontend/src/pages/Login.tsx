import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Select, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'

const { Title, Text } = Typography

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: Record<string, string>) => {
    setLoading(true)
    try {
      if (isRegister) {
        await register({ name: values.name, email: values.email, password: values.password, role: values.role as 'PATIENT' | 'DOCTOR' })
      } else {
        await login({ email: values.email, password: values.password })
      }
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { message?: string } } }).response.data?.message
        : undefined
      message.error(msg || (isRegister ? 'Registration failed' : 'Invalid email or password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        styles={{ body: { padding: 40 } }}
        style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8, color: '#667eea' }}>
            <SafetyOutlined />
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>Patient Management</Title>
          <Text type="secondary">
            {isRegister ? 'Create a new account' : 'Sign in to your account'}
          </Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" size="large">
          {isRegister && (
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Full Name" />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          {isRegister && (
            <Form.Item name="role" label="Role" rules={[{ required: true }]} initialValue="PATIENT">
              <Select
                options={[
                  { value: 'PATIENT', label: 'Patient' },
                  { value: 'DOCTOR', label: 'Doctor' },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {isRegister ? (
            <Text>
              Already have an account?{' '}
              <Button type="link" onClick={() => setIsRegister(false)} style={{ padding: 0 }}>
                Sign in
              </Button>
            </Text>
          ) : (
            <Text>
              Don't have an account?{' '}
              <Button type="link" onClick={() => setIsRegister(true)} style={{ padding: 0 }}>
                Register
              </Button>
            </Text>
          )}
        </div>
      </Card>
    </div>
  )
}
