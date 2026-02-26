# **INTERN TASK MANAGEMENT SYSTEM (MAIN FLOW – UPDATED)**

1. ## **Admin Creates a Task (Manage Tasks Page)**

Admin logs in and creates a new task with the following details:

* Task Title  
* Description  
* Assigned Intern  
* **Priority Level**:  
  * Low  
  * Medium  
  * High  
* **Deadline** (required date)

The task automatically appears in the Supervisor dashboard (shared portal).

Task Status: **Pending Supervisor Review**

2. ## **Supervisor Reviews the Task**

The Supervisor reviews task details including:

* Assigned Intern  
* Priority  
* Deadline  
* Description

Supervisor has three actions:

### **Approve**

* Task is automatically sent to the assigned Intern.  
* Status becomes: **Assigned / To Do**

### **Reject**

* Task is closed.  
* Status becomes: **Rejected**  
* Process ends.

### **Request Revision**

Supervisor must provide:

* **Revision Reason** (text field)

* **Revision Category** (select one):

  * Incomplete task details  
  * Incorrect intern assignment  
  * Deadline needs adjustment  
  * Not aligned with objectives  
  * Duplicate task

Status becomes: **For Revision**

The task is returned to Admin for modification.

3. ## **Admin Revises the Task**

When a task is marked **For Revision**, Admin:

* Views the revision reason  
* Adjusts necessary fields (intern, deadline, priority, description, etc.)  
* Resubmits the task

Status returns to: **Pending Supervisor Review**

The review cycle repeats until:

* Approved  
* Or Rejected

4. ## **Intern Receives the Task (After Approval)**

Once approved:

The assigned Intern can:

* View task details  
* See Priority (Low / Medium / High)  
* See Deadline  
* Update task status using:

  * To Do  
  * In Progress  
  * Completed

When Intern clicks **Completed**, task is submitted for Supervisor review.

Status becomes: **Pending Completion Review**

5. ## **Supervisor Reviews Completed Work**

Supervisor reviews the finished output.

Supervisor provides **Performance Feedback (Star Ratings):**

* Technical Skills  
* Communication  
* Teamwork  
* Timeliness

Feedback is saved.

Status becomes: **Completed**

6. ## **Intern Views Performance Feedback**

Intern can:

* View feedback per completed task  
* See star ratings and comments (if included)

**Final System Flow Summary**

Admin Creates Task (Priority \+ Deadline)  
 → Supervisor Reviews  
 → (Approve / Reject / Request Revision)  
 → If Revision → Back to Admin → Resubmit  
 → If Approved → Intern Works  
 → Intern Completes  
 → Supervisor Rates  
 → Intern Views Feedback

# **Other Features (Not Part of Main Task Flow)**

### **Time In / Time Out**

* Intern records attendance.  
* Works like normal daily time tracking.  
* Not connected to task workflow.

### **Announcements**

* Can be posted anytime.  
* Visible to selected roles (Admin / Supervisor / Intern).  
* Independent of task system.

