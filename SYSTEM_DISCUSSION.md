# PESO Quezon City — Labor Rights AI Chatbot
## System Discussion

---

## Purpose and Background

The PESO Quezon City Labor Rights AI Chatbot is a web-based application developed to support the Public Employment Service Office of Quezon City in delivering labor rights information to the general public. The system was designed with the recognition that many workers — particularly contractual employees, kasambahay or domestic workers, and fresh graduates entering the workforce — often lack accessible and reliable information about their legal rights under the Philippine Labor Code. By providing an AI-powered assistant available at any time of day, the system removes the barrier of having to visit a government office just to ask a basic question about wages, benefits, or employment conditions.

The primary goal of the system is not to replace human consultants but to serve as a first point of contact — answering common questions immediately, guiding users toward the correct legal provisions, and directing those with more complex concerns to book a formal consultation with PESO QC staff.

---

## System Architecture and Technology

The application is built on Next.js 16, a modern web framework that handles both the user interface and the server-side API logic within a single codebase. This approach simplifies deployment and keeps the system maintainable without requiring a separate backend server. The user interface is written in TypeScript and styled using Tailwind CSS, which ensures a consistent and professional appearance across devices.

For artificial intelligence capabilities, the system connects to OpenRouter, a third-party AI routing service, which forwards requests to the Nvidia Nemotron 3 Super 120B model. This large language model processes the user's question and generates a response based on a carefully written system prompt that contains the most current Philippine labor law data. All persistent data — including appointment bookings and chat conversation histories — is stored in Supabase, a cloud-hosted PostgreSQL database that provides both a public-facing client for general users and a privileged administrative client for PESO QC staff operations.

---

## How the Chat Feature Works

When a user types a question, the message is sent from the browser to the application's internal chat API endpoint. That endpoint prepends a system prompt to the conversation before forwarding the full message history to the AI model. The system prompt instructs the AI to act as a labor rights assistant representing PESO Quezon City, to always cite the specific Labor Code article or law that applies, to respond in the same language the user is writing in — whether Filipino, English, or Taglish — and to use the labor figures embedded directly in the prompt rather than relying on the model's general training data.

This last point is critical to the system's accuracy. Rather than trusting the AI to recall wage rates or contribution percentages from its training, the current figures are written directly into the system prompt. For example, the minimum wage for the National Capital Region under Wage Order No. NCR-26, effective May 1, 2026, is stated explicitly as ₱695 per day. Similarly, SSS, PhilHealth, and Pag-IBIG contribution rates for 2025 are embedded in full detail. The AI is instructed to treat these values as authoritative and to disregard any conflicting information from its training data. Updating any of these figures in the future requires only editing a single constant in the server-side code.

Each AI response also includes a set of two to three follow-up questions that the system suggests to the user, helping guide the conversation toward related topics they may not have thought to ask about. These suggestions appear as clickable chips below the AI's response, making the experience more interactive and reducing the effort required from the user.

Conversation history is saved to the database automatically during each exchange, associated with a session identifier stored in the browser's session storage. When the user returns to the page, their previous conversation is loaded from the database and restored, providing continuity without requiring a login. If the user chooses to clear their conversation, the records are deleted from the database as well, not just from the screen.

---

## Pay Calculator

In addition to the AI chat, the system includes a built-in pay calculator that operates entirely offline, without invoking the AI model. This tool allows users to compute three specific types of pay that are commonly misunderstood or miscalculated in practice.

The overtime pay calculator follows the formula prescribed under Labor Code Article 87, computing the product of the hourly rate, the applicable multiplier, and the number of overtime hours worked. A 25 percent premium applies for overtime on regular working days, while a 30 percent premium applies for overtime performed on rest days or holidays. The 13th month pay calculator applies the formula under Presidential Decree 851, dividing the product of the monthly basic salary and the number of months worked by twelve. The night shift differential calculator applies the 10 percent premium mandated by Labor Code Article 86 for any hours worked between 10 in the evening and 6 in the morning.

By separating these calculations from the AI, the system guarantees mathematical precision for these specific computations regardless of the AI model's availability or response quality.

---

## Appointment Booking

Workers who require a more detailed or personal consultation can submit an appointment request directly through the system. A booking form collects the user's full name, Philippine mobile number, preferred appointment date, and a description of their concern. The system validates all fields on both the client side — giving users immediate feedback as they fill out the form — and on the server side, ensuring that no incomplete or invalid data reaches the database regardless of how the request is made.

The date picker enforces two important rules: the selected date must be in the future, and it must fall on a weekday, since the PESO QC office is closed on Saturdays and Sundays. The contact number field accepts only valid Philippine mobile formats, either the local eleven-digit format beginning with 09 or the international format beginning with +639. Once submitted successfully, the booking is saved to the database with a default status of pending, and the user receives an on-screen confirmation.

---

## Admin Dashboard

PESO QC staff access a separate, password-protected dashboard at the /admin route of the application. Upon entering the correct password, the dashboard displays all submitted bookings in a table sorted from newest to oldest. Staff can filter the list by status — viewing all bookings, or narrowing the view to those that are pending, confirmed, or done — and each row shows the applicant's name, contact number, preferred date, concern description, submission timestamp, and current status.

Status updates can be made directly from the table using an inline dropdown. When a staff member changes the status of a booking, the update is sent to the server immediately and the table reflects the change without requiring a page refresh. If the update fails for any reason, an error message appears at the top of the dashboard to notify the staff member. Authentication is stateless — the password is held temporarily in the browser's memory for the duration of the session and is never stored in cookies or local storage, meaning the session ends automatically when the browser tab is closed.

---

## Security and Abuse Prevention

The system implements IP-based rate limiting on its two public-facing endpoints to prevent abuse. The chat endpoint allows a maximum of ten requests per minute from any single IP address, while the booking endpoint allows a maximum of three requests per minute. Each endpoint maintains its own counter, so activity on one does not affect the limit on the other. Requests that exceed the limit receive an error response and must wait until the next time window before trying again.

On the data security side, the system uses two separate Supabase clients with different levels of privilege. The public client, which is used for chat session storage and booking submissions from the browser, operates with an anonymous key that can only perform the operations explicitly permitted by Supabase's row-level security policies. The administrative client, which is used exclusively by the server-side admin API routes, operates with a service role key that bypasses those policies and has full database access. This key is never exposed to the browser and is only accessible within the server environment.

---

## Current Limitations and Future Considerations

The system has several known limitations that are worth acknowledging. The rate limiter uses an in-memory data structure, which means its counters reset whenever the server restarts and cannot be shared across multiple server instances. For a production deployment that scales horizontally, this would need to be replaced with a persistent, shared solution such as a Redis cache.

The admin authentication mechanism, while functional, is intentionally simple. There is no session expiry, no multi-user support, and no audit log of which actions were taken by staff. These would be necessary additions if the dashboard were to be used by multiple staff members or subjected to stricter security requirements.

The system currently does not send any email or SMS notifications. When a user submits a booking, the confirmation is displayed only on screen. Staff must actively check the admin dashboard to become aware of new submissions. Implementing automated notifications would significantly improve the responsiveness of the booking process and reduce the risk of appointments being overlooked.

Finally, while the AI model used is capable and multilingual, it is accessed through a free-tier arrangement, which can result in slower response times during periods of high demand on the provider's infrastructure. Upgrading to a paid tier or switching to a dedicated model would improve reliability and response speed for users.

---

## Summary

The PESO QC Labor Rights AI Chatbot represents a practical application of modern web technology and artificial intelligence in the context of public service delivery. It brings together an AI language model grounded in current Philippine labor law, a purpose-built pay calculator, a structured appointment booking system, and an administrative management interface — all within a single, cohesive web application. The system is designed to be approachable for workers with varying levels of digital literacy, accurate in its legal references, and manageable for PESO QC staff without requiring technical expertise to operate.
