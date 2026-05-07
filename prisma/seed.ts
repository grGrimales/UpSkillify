import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient, Language } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const prismaClientSingleton = () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const prisma = prismaClientSingleton()

async function main() {
  console.log('Starting bilingual seed...')

  // 1. Create an Admin User using environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@upskillify.com'
  const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'admin123'
  
  const adminPassword = await bcrypt.hash(adminPasswordRaw, 10)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // 2. Clear existing course
  await prisma.course.deleteMany({ where: { slug: 'terraform-basics' } })

  // 3. Create Course with translations
  const course = await prisma.course.create({
    data: {
      slug: 'terraform-basics',
      published: true,
      translations: {
        create: [
          {
            language: Language.EN,
            title: 'Terraform for Beginners',
            description: 'Learn Infrastructure as Code from scratch with Terraform.'
          },
          {
            language: Language.ES,
            title: 'Terraform para Principiantes',
            description: 'Aprende Infraestructura como Código desde cero con Terraform.'
          }
        ]
      },
      modules: {
        create: [
          {
            order: 1,
            translations: {
              create: [
                {
                  language: Language.EN,
                  title: 'Module 1: Introduction',
                  description: 'The basics of IaC.'
                },
                {
                  language: Language.ES,
                  title: 'Módulo 1: Introducción',
                  description: 'Los conceptos básicos de IaC.'
                }
              ]
            },
            topics: {
              create: [
                {
                  order: 1,
                  translations: {
                    create: [
                      {
                        language: Language.EN,
                        title: 'What is Terraform?',
                        content: 'Terraform is a tool for building, changing, and versioning infrastructure safely and efficiently.'
                      },
                      {
                        language: Language.ES,
                        title: '¿Qué es Terraform?',
                        content: 'Terraform es una herramienta para construir, cambiar y versionar infraestructura de forma segura y eficiente.'
                      }
                    ]
                  }
                }
              ]
            },
            exams: {
              create: [
                {
                  order: 1,
                  translations: {
                    create: [
                      {
                        language: Language.EN,
                        title: 'Intro Quiz',
                        description: 'Check your basic knowledge.'
                      },
                      {
                        language: Language.ES,
                        title: 'Quiz de Introducción',
                        description: 'Pon a prueba tus conocimientos básicos.'
                      }
                    ]
                  },
                  questions: {
                    create: [
                      {
                        translations: {
                          create: [
                            {
                              language: Language.EN,
                              text: 'Who created Terraform?',
                              options: ['Google', 'HashiCorp', 'AWS'],
                              explanation: 'HashiCorp is the creator.',
                              correctOption: 1
                            },
                            {
                              language: Language.ES,
                              text: '¿Quién creó Terraform?',
                              options: ['Google', 'HashiCorp', 'AWS'],
                              explanation: 'HashiCorp es el creador.',
                              correctOption: 1
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('Seed finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
