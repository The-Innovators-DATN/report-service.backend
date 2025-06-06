# Water Report Generator

## Overview

This project is a Node.js application designed to automate the generation and emailing of water usage reports. It generates PDF reports based on predefined templates, stores them in MinIO (S3-compatible storage), and sends them to users via email on a scheduled basis. The app leverages BullMQ for job queuing, Puppeteer for PDF generation, Redis for queue management, and Nodemailer for email delivery. It supports cron-based scheduling for both report generation and emailing.

## Features

- Schedule monthly water usage reports with customizable HTML templates
- Generate PDF reports using Puppeteer with styled HTML content
- Store PDFs in MinIO for persistent storage
- Send PDFs as email attachments using Nodemailer
- Manage background jobs with BullMQ and Redis for reliability
- Handle retries and failures for report generation and email sending
- Log job statuses and errors with Winston
- RESTful API for creating and managing scheduled reports

## Prerequisites

- Node.js (v16 or higher)
- Redis (for job queuing)
- MinIO (S3-compatible storage)
- SMTP server (for sending emails)
- Git (for cloning the repository)