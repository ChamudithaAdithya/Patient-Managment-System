import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Form, Input, Button, Card, Typography, Select, message, Checkbox, Divider, Space, Flex } from 'antd'
import { useAuth } from '../hooks/useAuth'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  HeartOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  MobileOutlined,
  GoogleOutlined,
} from '@ant-design/icons'

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

  const features = [
    { icon: <SafetyOutlined />, label: 'HIPAA Compliant', desc: 'Enterprise security' },
    { icon: <TeamOutlined />, label: 'Multi-role Access', desc: 'RBAC controlled' },
    { icon: <MedicineBoxOutlined />, label: 'Integrated Care', desc: 'All-in-one platform' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Row style={{ minHeight: '100vh' }}>
        <Col
          xs={0} sm={0} md={0} lg={0} xl={14}
          style={{
            background: 'linear-gradient(160deg, #0a1628 0%, #0d2137 40%, #183850 100%)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 48,
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-30%',
            right: '-20%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(24,144,255,0.08) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(114,46,209,0.06) 0%, transparent 70%)',
          }} />

          <Flex align="center" gap={12} style={{ position: 'absolute', top: 48, left: 48 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1890ff, #096dd9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HeartOutlined style={{ fontSize: 22, color: '#fff' }} />
            </div>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>MedCare</span>
          </Flex>

          <div style={{ textAlign: 'center', maxWidth: 480, zIndex: 1 }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(24,144,255,0.2), rgba(114,46,209,0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <HeartOutlined style={{ fontSize: 40, color: '#1890ff' }} />
              </div>
              <Title level={2} style={{ color: '#fff', marginBottom: 16, fontWeight: 700, fontSize: 32 }}>
                Welcome to MedCare
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.8, display: 'block' }}>
                A complete patient management system with integrated medical records,
                appointment scheduling, medical imaging, and real-time analytics.
              </Text>
            </div>

            <Flex justify="center" gap={48} style={{ marginTop: 48 }}>
              {features.map((f) => (
                <div key={f.label} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)' }}>{f.icon}</span>
                  </div>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block' }}>{f.desc}</Text>
                </div>
              ))}
            </Flex>
          </div>

          <Text style={{ position: 'absolute', bottom: 32, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
            &copy; 2026 MedCare Systems. All rights reserved.
          </Text>
        </Col>

        <Col xs={24} sm={24} md={24} lg={24} xl={10} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: '100vh' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ display: 'none' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <HeartOutlined style={{ fontSize: 26, color: '#fff' }} />
                </div>
              </div>
              <Title level={3} style={{ marginBottom: 8, fontWeight: 700 }}>
                {isRegister ? 'Create an account' : 'Welcome back'}
              </Title>
              <Text type="secondary">
                {isRegister
                  ? 'Register as a patient or doctor to get started'
                  : 'Sign in to your account to continue'}
              </Text>
            </div>

            <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" size="large" requiredMark={false}>
              {isRegister && (
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: 'Please enter your name' }]}
                >
                  <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} placeholder="Full Name" />
                </Form.Item>
              )}

              <Form.Item
                name="email"
                label="Email Address"
                rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input prefix={<MailOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} placeholder="you@hospital.com" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;" />
              </Form.Item>

              {isRegister && (
                <Form.Item name="role" label="Account Type" rules={[{ required: true, message: 'Please select a role' }]} initialValue="PATIENT">
                  <Select
                    options={[
                      { value: 'PATIENT', label: 'Patient — Access your medical records and appointments' },
                      { value: 'DOCTOR', label: 'Doctor — Manage patients and clinical workflows' },
                    ]}
                  />
                </Form.Item>
              )}

              {!isRegister && (
                <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                  <Checkbox>Remember me</Checkbox>
                  <Button type="link" style={{ padding: 0 }}>Forgot password?</Button>
                </Flex>
              )}

              <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ height: 48, borderRadius: 8, fontSize: 16 }}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </Button>
            </Form>

            <Flex justify="center" gap={8} style={{ marginTop: 32 }}>
              <Text type="secondary">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Button type="link" onClick={() => setIsRegister(!isRegister)} style={{ padding: 0 }}>
                {isRegister ? 'Sign in' : 'Register'}
              </Button>
            </Flex>
          </div>
        </Col>
      </Row>
    </div>
  )
}
