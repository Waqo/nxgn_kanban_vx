/**
 * Centralized constants for API names, report names, form names,
 * field names, and other application-wide static values.
 */

// --- Application Identification ---
export const APP_NAME = "nexgen-portal"; // Replace if needed


// --- Startup / Debug Flags ---
export const START_IN_DEMO_MODE = true; // Set true for demo-only version, false for normal

// --- Report Link Names ---
export const REPORT_PROJECTS = "Main_Projects";
export const REPORT_PROJECT_DETAILS = "Main_Project_Details"; // Added for detail modal fetches
export const REPORT_STAGES = "PM_Kanban_Stages";
export const REPORT_TAGS = "PM_Kanban_Tags";
export const REPORT_USERS = "PM_Kanban_Users";
export const REPORT_SALES_REPS = "PM_Kanban_Sales_Reps";
export const REPORT_SALES_ORGS = "All_Sales_Organizations";
export const REPORT_TRANCHES = "PM_Tranches_Report";
export const REPORT_EQUIPMENT = "PM_Kanban_Equipment";
export const REPORT_DOC_TYPES = "All_Document_Types"; // Assuming report name
export const REPORT_CONTACTS = "PM_Kanban_Contacts"; // Assuming report name
export const REPORT_SURVEYS = "PM_Kanban_Surveys"; // Add Survey report
export const REPORT_BILL_OF_MATERIALS = "PM_Kanban_Materials"; // Add BOM report
export const REPORT_PERMITTING = "PM_Kanban_Permits"; // Assuming report name
export const REPORT_DOCUMENTS = "PM_Kanban_Documents"; // Assuming report name
export const REPORT_EMAIL_TEMPLATES = "Main_Email_Templates"; // Assumption - Verify this name
export const REPORT_ISSUES = "PM_Kanban_Issues"; // Added for fetching/updating issues if needed separately
export const REPORT_NOTES = "PM_Kanban_Notes"; // Added for fetching/updating notes if needed separately
export const REPORT_NOTE_ATTACHMENTS = "PM_Kanban_Note_Attachments"; // Added for fetching/updating note attachments if needed separately
export const REPORT_PUBLISHED_NOTE_ATTACHMENTS = "Published_Note_Attachments"; // Added for fetching/updating published note attachments if needed separately
export const REPORT_PUBLISHED_DOCUMENTS = "Published_Documents"; // Added for fetching/updating published documents if needed separately
// Add other report names as needed

// --- Form Link Names ---
export const FORM_PROJECTS = "Add_Project"; // Assuming form name
export const FORM_CONTACTS = "Add_Contact"; // *** ADDED ***
export const FORM_NOTES = "Add_Note"; // *** ADDED ***
export const FORM_NOTE_ATTACHMENTS = "Add_Note_Attachment"; // *** ADDED ***
export const FORM_DOCUMENTS = "Add_Document"; // *** ADDED ***
export const FORM_ISSUES = "Add_Issue"; // Corrected from Add_Issues
export const FORM_SURVEYS = "Add_Survey_Result"; // Add Survey form
export const FORM_BILL_OF_MATERIALS = "Add_Bill_of_Material"; // Add BOM form
export const FORM_PERMITTING = "Add_Permitting"; // Assuming form name
export const FORM_COMMUNICATION = "Add_Communication"; // *** ADDED for Comms Tab ***
export const FORM_LOGS = "Add_Logs"; // *** ADDED for Error Logging ***

// Add other form names as needed (e.g., for adding notes, issues)

// --- Kanban Initialization Data ---
export const REPORT_KANBAN_INIT = "All_Kanban_Init";
export const KANBAN_INIT_RECORD_ID = "4663646000004794131";

// --- Field API Link Names (Commonly Used) ---
// Project Fields
export const FIELD_PROJECT_ID = 'ID'; // System Generated
export const FIELD_PROJECT_STAGE_LOOKUP = 'New_Stage';
export const FIELD_PROJECT_TAGS = 'Tags';
export const FIELD_PROJECT_TRANCHE_LOOKUP = 'Tranche';
export const FIELD_PROJECT_IS_DEMO = 'Is_Demo';
export const FIELD_PROJECT_ARCHIVED_STAGE_ID = '4663646000002634104';
export const FIELD_PROJECT_PRE_SALE_STAGE_ID = '4663646000002634108';
export const FIELD_PROJECT_CANCELLED_STAGE_ID = '4663646000002634100';
export const FIELD_PROJECT_NOT_VIABLE_STAGE_ID = '4663646000003182023';
export const FIELD_PROJECT_HO_CANCELLED_REDBALL_STAGE_ID = '4663646000004083003';
export const FIELD_PROJECT_DUPLICATE_JOBS_STAGE_ID = '4663646000004816066'; // Added Duplicate Jobs stage
export const FIELD_PROJECT_CONTACT_NAME_LOOKUP = 'Owner_Name';
export const FIELD_PROJECT_CONTACT_EMAIL = 'Owner_Name.Email';
export const FIELD_PROJECT_CONTACT_PHONE = 'Owner_Name.Phone_Number';
export const FIELD_PROJECT_ADDRESS = 'Site_Address';
export const FIELD_PROJECT_OS_ID = 'OpenSolar_Project_ID';
export const FIELD_PROJECT_KW_STC = 'kW_STC';
export const FIELD_PROJECT_PAYMENT_OPTION = 'Payment_Option';
export const FIELD_PROJECT_DATE_SOLD = 'Date_Sold';
export const FIELD_PROJECT_INSTALL_DATE_TIME = 'Installation_Date_Time';
export const FIELD_PROJECT_COMMERCIAL = 'Commercial';
export const FIELD_PROJECT_FUNDED_REDBALL = 'Funded_By_Redball';
export const FIELD_PROJECT_ADUU_ID = 'Aduu_Solar_Portal_ID1';
export const FIELD_PROJECT_FOLDER_LINK = 'Project_Folder_Link';
export const FIELD_PROJECT_INVESTOR_FOLDER_LINK = 'Project_Investor_Folder_Link';
export const FIELD_PROJECT_NEED_HELP = 'Need_Help';
export const FIELD_PROJECT_TRIG_CREATE_FOLDERS = 'TRIG_Create_Project_Folders'; // *** ADDED (Assumption) ***

// User Fields
export const FIELD_USER_ID = 'ID'; // System generated
export const FIELD_USER_EMAIL = 'Email';
export const FIELD_USER_NAME = 'Name'; // Composite Name field
export const FIELD_USER_ROLE = 'Role';

// Stage Fields
export const FIELD_STAGE_ID = 'ID'; // System generated
export const FIELD_STAGE_NAME = 'Stage_Name';
export const FIELD_STAGE_VIEW = 'Stage_View';
export const FIELD_STAGE_ORDER = 'Stage_Order';
export const FIELD_STAGE_ACTIVE_STATUS = 'Active_Status';

// Tag Fields
export const FIELD_TAG_ID = 'ID'; // System generated
export const FIELD_TAG_NAME = 'Tag_Name';
export const FIELD_TAG_COLOR = 'Tag_Color';
export const FIELD_TAG_CATEGORY = 'Category';
export const FIELD_TAG_DESCRIPTION = 'Tag_Description';
export const FIELD_TAG_ACTIVE_STATUS = 'Active_Status';

// Sales Rep Fields
export const FIELD_SALES_REP_ID = 'ID'; // System generated
export const FIELD_SALES_REP_NAME = 'Name'; // Composite Name field

// Sales Org Fields
export const FIELD_SALES_ORG_ID = 'ID'; // System generated
export const FIELD_SALES_ORG_NAME = 'Org_Name';

// Tranche Fields
export const FIELD_TRANCHE_ID = 'ID'; // System generated
export const FIELD_TRANCHE_NUMBER = 'Tranche_Number';

// --- ADD Communication Fields ---
export const FIELD_COMMUNICATION_EMAIL_TEMPLATE_LOOKUP = 'Email_Template'; // Assumption

// --- App Version Info ---
export const APP_VERSION = '3.0.0-beta.3';
export const APP_BUILD_DATE_STR = 'May 1, 2025 11:56 PM';
export const APP_BUILD_INFO = `v${APP_VERSION} (${APP_BUILD_DATE_STR})`; 

// --- Error Logging Constants ---
// Duplicate removed export const FORM_LOGS = "Add_Logs"; // Assuming form name

// --- Note Fields ---
export const FIELD_NOTE_ID = 'ID'; // System Generated
export const FIELD_NOTE_CONTENT = 'Note'; // Textarea
export const FIELD_NOTE_PROJECT_LOOKUP = 'Project'; // Lookup to Add_Project
export const FIELD_NOTE_AUTHOR_TEXT = 'Author'; // Text (User name)
export const FIELD_NOTE_USER_LOOKUP = 'User_Lookup'; // Lookup to Add_User
export const FIELD_NOTE_TEAM_ONLY = 'Team_Only'; // Checkbox
export const FIELD_NOTE_CONTEXT = 'Context'; // Picklist
export const FIELD_NOTE_DEPARTMENT = 'Department'; // Text
export const FIELD_NOTE_REPLIED_TO = 'Replied_To'; // Lookup to Add_Note
export const FIELD_NOTE_TAGGED_USERS = 'Tagged_Users'; // List Lookup to Add_User
// export const FIELD_NOTE_ATTACHMENT_FIELD = 'Attachments'; // Field in Add_Note? Or field in Add_Note_Attachment?

// --- Note Attachment Fields ---
export const FIELD_NOTE_ATTACHMENT_ID = 'ID'; // System Generated
export const FIELD_NOTE_ATTACHMENT_NOTE_LOOKUP = 'Note'; // Lookup to Add_Note
export const FIELD_NOTE_ATTACHMENT_NAME = 'Name'; // Text
export const FIELD_NOTE_ATTACHMENT_FIELD = 'File_field'; // File Upload Field in Add_Note_Attachment
export const FIELD_NOTE_ATTACHMENT_PROJECT_LOOKUP = 'Project'; // Lookup to Add_Project (Added)
export const FIELD_NOTE_ATTACHMENT_USER_LOOKUP = 'User'; // Lookup to Add_User (Added)
// export const FIELD_NOTE_ATTACHMENT_IMAGE = 'Image'; // Image field? (Seems less used)
export const FIELD_NOTE_ATTACHMENT_TRANSFER_TRIGGER = 'Transfer_Trigger'; // Added based on old code

// --- Document Fields ---
export const FIELD_DOC_ID = 'ID'; // System Generated
export const FIELD_DOC_NAME = 'Document_Name'; // Text
export const FIELD_DOC_TYPE_LOOKUP = 'Doc_Type'; // Lookup to Add_Document_Type
export const FIELD_DOC_FILE_UPLOAD = 'File_Upload'; // File Upload Field (Added Constant)
export const FIELD_DOC_IS_REVISION = 'Is_Revision'; // Checkbox
export const FIELD_DOC_REVISION_NUMBER = 'Revision_Number'; // Number
export const FIELD_DOC_PROJECT_LOOKUP = 'Project'; // Lookup to Add_Project
export const FIELD_DOC_USER_LOOKUP = 'User_Lookup'; // Lookup to Add_User
export const FIELD_DOC_WD_LINK = 'WorkDrive_Link'; // URL Field
export const FIELD_DOC_WD_ID = 'WorkDrive_ID'; // Text
export const FIELD_DOC_WD_UPLOAD_TRIGGER = 'TRIG_Upload_to_WorkDrive'; // Checkbox Trigger
export const FIELD_DOC_INVESTOR_SEND_TRIGGER = 'Trigger_Send_to_Inv'; // Checkbox Trigger
export const FIELD_DOC_INVESTOR_SENT_FLAG = 'Sent_To_Investor_Portal'; // Checkbox Status

// --- Activity Log Constants ---
export const FORM_ACTIVITIES = 'Add_Activities';
export const FIELD_ACTIVITY_DESCRIPTION = 'Activity';
export const FIELD_ACTIVITY_WHO = 'Is_Who';
export const FIELD_ACTIVITY_WHERE = 'Where';
export const FIELD_ACTIVITY_PROJECT_LOOKUP = 'Project'; // Verify this is the lookup field in Add_Activities form
export const ACTIVITY_SOURCE_PORTAL = 'Portal';

// --- Other Constants ---
export const DEFAULT_SORT_FIELD = 'Owner_Name_Display';
export const DEFAULT_SORT_DIRECTION = 'asc';



// --- Default UI Settings ---
export const DEFAULT_KANBAN_STAGE_VIEW = 'all'; // Initial view filter ('all', 'sales', 'install')
export const DEFAULT_KANBAN_BOARD_MODE = 'stages'; // Initial board mode ('stages', 'tranches')

// --- User/Admin Identification ---
export const ADMIN_USER_EMAIL = 'admin@dcnexgen.com'; // Email used to identify the admin 

// --- Tag Category Colors ---
export const TAG_CATEGORY_COLORS = {
    // Map Category Name to BaseBadge color prop value
    'Action Required': 'red',
    'Informational': 'blue',
    'Missing Information': 'yellow',
    // Add other categories if they exist
    // Default/Fallback
    default: 'gray' 
}; 

// Issue Fields (from Add_Issue form)
export const FIELD_ISSUE_ID = 'ID'; // System Generated
export const FIELD_ISSUE_CONTENT = 'Issue'; // Textarea
export const FIELD_ISSUE_PROJECT_LOOKUP = 'Project'; // Lookup to Add_Project
export const FIELD_ISSUE_AUTHOR_TEXT = 'Author'; // Text (Fallback?)
export const FIELD_ISSUE_USER_LOOKUP = 'User_Lookup'; // Lookup to Add_User
export const FIELD_ISSUE_NOTIFY_SALES = 'Notify_Sales'; // Checkbox
export const FIELD_ISSUE_TAGGED_USERS = 'Tagged_Users'; // List Lookup to Add_User
export const FIELD_ISSUE_IS_RESOLVED = 'Is_Resolved'; // Checkbox
export const FIELD_ISSUE_RESOLVED_BY = 'Resolved_By'; // Lookup to Add_User (or maybe just Text?) - Assume Lookup for now 