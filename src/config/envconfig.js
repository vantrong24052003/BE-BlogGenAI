import dotenv from 'dotenv'
import * as yup from 'yup'

dotenv.config()

const envSchema = yup.object().shape({
  // database
  USER_DB: yup.string().required('USER_DB is required'),
  PASSWORD_DB: yup.string().required('PASSWORD_DB is required'),
  HOST_DB: yup.string().required('HOST_DB is required'),
  PORT_DB: yup.number().required('PORT_DB is required'),
  NAME_DB: yup.string().required('NAME_DB is required'),
  // server
  GOOGLE_LLM_API_KEY: yup.string().required('GOOGLE_LLM_API_KEY is required'),
  PORT: yup.number().required('PORT is required'),
  HOST: yup.string().required('HOST is required'),
  // email
  EMAIL_HOST: yup.string().required('EMAIL_HOST is required'),
  EMAIL_PORT: yup.number().required('EMAIL_PORT is required'),
  EMAIL_USER: yup.string().required('EMAIL_USER is required'),
  EMAIL_PASSWORD: yup.string().required('EMAIL_PASSWORD is required'),
  EMAIL_FROM: yup.string().required('EMAIL_FROM is required')
})

const envConfig = (() => {
  try {
    const env = envSchema.validateSync(process.env, { abortEarly: false })
    return env
  } catch (error) {
    console.error('Invalid environment variables:', error.errors)
    process.exit(1)
  }
})()

export default envConfig
