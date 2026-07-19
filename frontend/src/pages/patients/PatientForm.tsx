import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, DatePicker, Spin, message } from 'antd'
import { getById, create, update } from '../../api/patients'
import { parseError } from '../../lib/errorHandler'
import type { PatientRequest } from '../../types/patient'
import dayjs from 'dayjs'

const { Title } = Typography

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (id) {
      getById(id)
        .then((p) => form.setFieldsValue({
          ...p,
          dateOfBirth: p.dateOfBirth ? dayjs(p.dateOfBirth) : undefined,
          registeredDate: p.registeredDate ? dayjs(p.registeredDate) : undefined,
        }))
        .finally(() => setFetching(false))
    }
  }, [id])

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true)
    try {
      const payload: PatientRequest = {
        name: values.name as string,
        email: values.email as string,
        phone: (values.phone as string) || '',
        address: values.address as string,
        dateOfBirth: values.dateOfBirth ? (values.dateOfBirth as dayjs.Dayjs).format('YYYY-MM-DD') : '',
        registeredDate: values.registeredDate ? (values.registeredDate as dayjs.Dayjs).format('YYYY-MM-DD') : '',
      }
      if (isEdit) {
        await update(id!, payload)
        message.success('Patient updated')
      } else {
        await create(payload)
        message.success('Patient created')
      }
      navigate('/patients')
    } catch (err) {
      const parsed = parseError(err)
      if (parsed.fieldErrors) {
        const fields = Object.entries(parsed.fieldErrors).map(([name, msg]) => ({
          name,
          errors: [msg as string],
        }))
        form.setFields(fields)
      }
      message.error(parsed.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 16 }}>{isEdit ? 'Edit Patient' : 'New Patient'}</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="registeredDate" label="Registered Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? 'Update' : 'Create'}</Button>
            <Button onClick={() => navigate('/patients')}>Cancel</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
