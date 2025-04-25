/**
 * Centralized constants for API names, report names, form names,
 * field names, and other application-wide static values.
 */

// --- Application Identification ---
export const APP_NAME = "nexgen-portal"; // Replace if needed


// --- Startup / Debug Flags ---
export const START_IN_DEMO_MODE = true; // Set true for demo-only version, false for normal

// --- Report Link Names ---
export const REPORT_PROJECTS = "PM_Kanban_Projects";
export const REPORT_STAGES = "PM_Kanban_Stages";
export const REPORT_TAGS = "PM_Kanban_Tags";
export const REPORT_USERS = "PM_Kanban_Users";
export const REPORT_SALES_REPS = "PM_Kanban_Sales_Reps";
export const REPORT_SALES_ORGS = "All_Sales_Organizations";
export const REPORT_TRANCHES = "PM_Tranches_Report";
export const REPORT_EQUIPMENT = "PM_Kanban_Equipment";
export const REPORT_DOC_TYPES = "All_Document_Types"; // Assuming report name
export const REPORT_CONTACTS = "PM_Kanban_Contacts"; // Assuming report name
// Add other report names as needed

// --- Form Link Names ---
export const FORM_PROJECTS = "Add_Project"; // Assuming form name
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

// Add other important field API names

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