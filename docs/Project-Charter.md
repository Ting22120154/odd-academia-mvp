# PROJECT CHARTER
Odd Academia Platform Development

## Team Members
- Ting-An Wang
- Talha Ahmed
- Rohit Bhattarai
- Hamim Hadi Riyaz Kidavintavida

## Client / Supervisor / Submission
- **Client**: Se-on (Odd Academia)
- **Academic Supervisor**: Dr. Tad Bak
- **Submission Date**: 27 March 2026

---

## 1. Executive summary
This project aims to design and develop a web-based platform that will allow students and emerging researchers to showcase their academic work in a well-organized and interactive space. The system will allow users to create profiles, upload documents such as PDF and Word files, and engage with others through commenting and interaction features.

The platform also fills the existing gap by providing students with a specific area to showcase their work in a professional manner beyond conventional submissions. Users will be able to create a portfolio of their work and share it with potential employers through a centralized, accessible platform, increasing employability and visibility.

The proposed solution will be delivered as a Minimum Viable Product (MVP) within the academic timeframe. Key milestones include project planning, design validation, development, testing, and final delivery. The expected business value includes improved access to academic work, enhanced collaboration, and a platform for students to demonstrate their capabilities in a practical, professional manner.

---

## 2. Project Purpose & Scope

### 2.1 Client Details
- Client: Se-on (Platform Sponsor)
- Organisation: Independent Project Sponsor

### 2.2 Problem Statement
Early-stage researchers and students currently lack a dedicated platform to showcase their academic work in a professional, interactive way. Current platforms are primarily focused on formal research publications and are neither accessible nor applicable at the student level.

### 2.3 Objectives
- Develop a platform for users to upload and share academic work
- Enable user interaction through comments and engagement features
- Provide profile-based portfolios for users
- Deliver a functional MVP within the project timeframe

### 2.4 Scope
**In scope**
- User registration and authentication
- User profile creation and management
- Uploading and viewing documents (PDF and Word files)
- Public commenting system on posts
- Predefined subject categorisation
- Basic notification functionality
- UI implementation based on Figma design

**Out of scope**
- Private messaging system
- Advanced analytics and reporting
- Full admin dashboard
- Scalable production infrastructure
- Complex recommendation systems

---

## 3. Roles, Responsibilities & Team Capability

### 3.1 Key Stakeholders
- Client (Seon) - Defines requirements and approves deliverables
- Academic supervisor (Ted) - Provides academic guidance and assessment
- Development Team - Responsible for design, development, and delivery

### 3.2 Roles and Responsibilities
**Team Lead - Talha Ahmed**
- Coordinating the team; arranging meetings with team, client, supervisor
- Managing communication process within the project
- Primary contact for client meetings; posing and clarifying questions
- Ensuring the team understands requirements and Figma designs

**Technical lead - Rohit**
- Key technical decisions (technologies/frameworks/tools)
- Manages system architecture and integrations (auth, file uploads, notifications, etc.)
- Ensures code quality and scalability considerations
- Guides team members on technical issues; keeps approach feasible in timeframe

**Product lead - Ting**
- Ensures implementation matches Figma and client expectations
- Ensures consistent UX/UI across the platform
- Works with client and team to refine requirements and prioritise features

**QA Lead - Hadi**
- Testing during development life cycle; finds bugs/usability issues
- Oversees functional testing and user acceptance testing (UAT)
- Ensures final product is stable and ready to deliver

**Developers (All team members)**
- Build core features (auth, profile management, document uploads)
- Implement commenting and interaction functionalities
- Collaborate via GitHub for version control and integration
- Attend regular meetings and provide progress updates

### 3.3 Team Capability
The team consists of members with backgrounds in Computer Science and Information Systems. Team members have basic to intermediate programming skills in languages such as C, JavaScript, and Python.

Tools used:
- GitHub for version control and collaboration
- Figma provided by the client for design reference
- Cursor (AI-assisted development tool) to support coding

---

## 4. Solution Overview

### 4.1 Solution Overview
The proposed solution is a web-based research-sharing platform that allows students, researchers, and citizen scientists to create profiles and share their research outputs. The system is designed to function similarly to a social-media-style platform for research, enabling users to upload and present their work in an accessible and engaging format. The primary goal of the project is to develop a Minimum Viable Product (MVP) that delivers core functionality rather than a complete production system.

### 4.2 Core Features of the MVP
- User profile creation and management
- Admin page
- Uploading research documents (PDF or Word)
- Creating posts for research content
- Basic categorisation using tags or subjects
- Commenting and interaction on posts
- Notification

Advanced features such as analytics, tracking, or complex recommendation systems are not required in the MVP stage.

### 4.3 System Workflow (User Flow)
1. User creates an account and profile
2. User uploads a research document
3. User adds title, summary, and category/tags
4. The system generates a post/page for the research
5. Other users can view the post
6. Users can comment and interact with the research

### 4.4 Platform Characteristics
- Web-based application
- Primarily accessed via laptops and tablets
- Mobile accessibility is desirable but not required

### 4.5 Development Approach
Due to limited time and team experience, the system will not be built entirely from scratch. A simplified approach will be adopted, focusing on delivering functional features incrementally, prioritising working components over completeness, and using tools that support efficient development.

---

## 5. Requirements and Deliverables

### 5.1 High-Level Business Functions
| ID | Business Function | Description | Priority |
|---|---|---|---|
| BF1 | User Account Management | Users can register, login, and securely access their accounts. | Essential |
| BF2 | Profile Management | Users can create and maintain a professional academic profile. | Essential |
| BF3 | Paper Management | Users can upload, manage, and view research papers. | Essential |
| BF4 | Search & Discovery | Users can search and filter research content. | Essential |
| BF5 | User Interaction | Users can like, comment, and engage with papers. | Essential |
| BF6 | Notifications | Users receive updates on interactions. | Desirable |

### 5.2 Features / Epics
- **BF1 – User Account Management**
  - Email/LinkedIn registration
  - Login & authentication
- **BF2 – Profile Management**
  - Create/edit profile
  - Add bio, links, status
- **BF3 – Paper Management**
  - Upload documents
  - Add metadata
  - View papers
- **BF4 – Search & Discovery**
  - Search bar
  - Category filters
- **BF5 – User Interaction**
  - Like
  - Comment
  - Download
- **BF6 – Notifications**
  - Interaction alerts

### 5.3 User Stories
| ID | BF | User Story | Priority |
|---|---|---|---|
| US1 | BF1 | As a user, I want to register so that I can create an account. | High |
| US2 | BF1 | As a user, I want to log in so that I can access my account. | High |
| US3 | BF2 | As a user, I want to create a profile so that I can showcase my work. | High |
| US4 | BF2 | As a user, I want to edit my profile so that I can update details. | High |
| US5 | BF3 | As a user, I want to upload a paper so that others can view it. | High |
| US6 | BF3 | As a user, I want to add title/keywords so that content is clear. | High |
| US7 | BF4 | As a user, I want to search papers so that I find relevant work. | High |
| US8 | BF4 | As a user, I want to filter content so that browsing is easier. | High |
| US9 | BF5 | As a user, I want to like/comment so that I can engage. | High |
| US10 | BF6 | As a user, I want notifications so that I stay updated. | Medium |

### 5.4 Deliverables
- Working web platform (Core MVP)
- Authentication system
- Paper upload & viewing
- Search & interaction features
- Source code (GitHub)
- Database design
- Frontend/backend
- Documentation (Project Charter + setup guide)
- Testing (test cases + final tested MVP)

---

## 6. Milestones
| Milestone | Description | Planned Date |
|---|---|---|
| Project Charter Approved | Project scope and documentation approved by client and supervisor | Week 4 |
| Development Plan Approved | Technical approach and system design confirmed | Week 5 |
| Prototype Approved | Initial prototype reviewed and accepted by client | Week 6 |
| Core Features Completed | All MVP core features implemented and functional | Week 10 |
| Testing Completed | System testing and bug fixing finalised | Week 11 |
| Final Delivery Approved | Final system demonstrated and accepted by the client | Week 12 |

---

## 7. Release Schedule

### 7.1 Release Schedule
| ID | BF Feature | Responsible | Iteration | Start | Finish | Status |
|---|---|---|---|---|---|---|
| R1 | BF1 User Registration & Login | Rohit | Iteration 1 | Week 5 | Week 6 | Planned |
| R2 | BF2 Profile Creation & Editing | Ting | Iteration 1 | Week 5 | Week 7 | Planned |
| R3 | BF3 Paper Upload Functionality | Talha | Iteration 1 | Week 6 | Week 8 | Planned |
| R4 | BF3 Post Creation & Viewing | Ting | Iteration 2 | Week 7 | Week 9 | Planned |
| R5 | BF4 Search & Filter System | Rohit | Iteration 2 | Week 8 | Week 10 | Planned |
| R6 | BF5 Commenting & Interaction | Talha | Iteration 2 | Week 9 | Week 10 | Planned |
| R7 | BF6 Notification System | Rohit | Iteration 3 | Week 10 | Week 11 | Planned |
| R8 | BF5 System Testing & Bug Fixing | Hadi | Iteration 3 | Week 10 | Week 11 | Planned |
| R9 | Final Integration & Deployment | Team | Iteration 3 | Week 11 | Week 12 | Planned |

### 7.2 Release Strategy
The project will follow an MVP-first release approach, delivering only essential features in the initial release and deferring advanced features to future versions. Development will be organised into multiple iterations, as outlined in the Release Schedule (Section 7.1). Each iteration focuses on delivering a set of functional features that can be tested and validated before progressing to the next stage.

---

## 8. Cost-Benefit Analysis

### Costs
| Category | Description | Cost (AUD) |
|---|---|---:|
| Development Time | 480 hours (4 members × 10 hrs/week × 12 weeks) valued at $25/hour (conservative student rate) | $12,000 |
| Infrastructure | AWS hosting, storage, and deployment (1 year, low usage MVP) | $300 |
| Tools & Software | Cursor, Figma, GitHub (mostly free tiers, small paid features) | $200 |
| Training / Learning Curve | Extra time due to lack of experience (~80 additional hours × $25/hour) | $2,000 |
| Coordination Overhead | Inefficiency in meetings, scheduling delays (~40 hours × $25/hour) | $1,000 |
| **Total Costs** |  | **$15,500** |

### Benefits (For the Client)
| Category | Description | Value (AUD) |
|---|---|---:|
| Development Cost Savings | Avoid hiring freelance/full-time developers (estimated 200–300 hours at ~$40/hour) | $10,000 |
| MVP Prototype Value | Functional prototype to present to investors or stakeholders | $5,000 |
| Idea Validation | Early testing prevents investing in a failed full-scale product | $4,000 |
| Faster Time to Market | Reduces initial development timeline by ~2–3 months | $3,000 |
| **Total Benefits** |  | **$22,000** |

### Net Benefits
- Total Benefits: $22,000
- Total Costs: $15,500
- Net Benefit: $6,500
- Cost–Benefit Ratio = 22,000 / 15,500 = 1.42

---

## 9. Risks
| Risk | Mitigation Strategy | Impact Level |
|---|---|---|
| Limited development time (7–8 weeks) may result in incomplete MVP | Prioritise core features only; use sprint planning and weekly reviews to track progress | High |
| Skill gap in full-stack development may slow implementation | Allocate simpler tasks to beginners; use tutorials, peer learning, and supervisor guidance | High |
| Scope creep due to evolving client expectations | Define and freeze MVP scope early; require approval for any additional features | High |
| Communication breakdown between team and client | Schedule weekly client updates; maintain shared documentation (e.g., GitHub, Notion) | Medium |
| Dependency on AI tools may produce unreliable code | Review and test all generated code; maintain manual control over critical components | Medium |
| Integration challenges (authentication, file uploads, etc.) | Develop and test integrations early; use proven libraries and frameworks | Medium |

---

## 10. Constraints
| Constraint | Mitigation Strategy | Type |
|---|---|---|
| Limited project duration (12 weeks) | Create detailed timeline with milestones; prioritise MVP features | Time |
| No dedicated funding | Use free-tier tools and open-source technologies | Cost |
| Limited team experience in full-stack development | Allocate time for learning and prototyping before development | Resource |
| Requirement to deliver only MVP | Clearly define feature boundaries and avoid over-engineering | Scope |
| Academic requirements (reports, documentation) | Allocate separate time for documentation tasks | Scope |

---

## 11. Communication Plan
**Internal Team Communication**
- Platform: Slack (primary communication channel)
- Purpose: daily coordination, progress updates, discussing blockers

**Project Management & Tracking**
- Platform: Notion
- Purpose: task allocation, progress tracking, documentation and decisions

**Client Communication**
- Method: Scheduled Zoom meetings
- Frequency: weekly or as required
- Purpose: requirement clarification, progress updates, feedback on MVP

**Supervisor Communication**
- Method: Zoom meetings
- Frequency: weekly
- Purpose: academic guidance, progress evaluation

**Meeting Structure**
- Regular stand-ups (2 times per week)
- Each member shares: completed work, current tasks, blockers

---

## 12. Handover Plan
**Deliverables to Client**
- Functional MVP of the Odd Academia platform
- Source code (via GitHub repository)
- Documentation (setup instructions, architecture overview)

**Code Ownership**
- The intellectual property belongs to the student team
- The team may choose to make the project open-source / allow client to use and extend the code

**Handover Process**
1. Final demonstration of the platform to the client
2. Walkthrough of features and system functionality
3. Sharing GitHub repository access
4. Providing setup and deployment instructions

**Post-Handover Considerations**
Future improvements may include advanced analytics, messaging system, and improved UI/UX.

