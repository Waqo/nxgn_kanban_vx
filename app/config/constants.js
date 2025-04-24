/**
 * Centralized constants for API names, report names, form names,
 * field names, and other application-wide static values.
 */

// --- Application Identification ---
export const APP_NAME = "nexgen-portal"; // Replace if needed

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

// --- Field API Link Names (Commonly Used) ---
// Project Fields
export const FIELD_PROJECT_STAGE_LOOKUP = "New_Stage";
export const FIELD_PROJECT_TRANCHE_LOOKUP = "Tranche";
export const FIELD_PROJECT_TAGS = "Tags";
export const FIELD_PROJECT_IS_DEMO = "Is_Demo";
export const FIELD_PROJECT_ARCHIVED_STAGE_ID = "4663646000002634108"; // Specific ID for Archived stage
export const FIELD_PROJECT_PRE_SALE_STAGE_ID = "4663646000002634108"; // TODO: Same ID as Archived? Please verify.
export const FIELD_PROJECT_CANCELLED_STAGE_ID = "4663646000002891015";
export const FIELD_PROJECT_NOT_VIABLE_STAGE_ID = "4663646000003176007";
export const FIELD_PROJECT_HO_CANCELLED_REDBALL_STAGE_ID = "4663646000003395003";

// User Fields
export const FIELD_USER_EMAIL = "Email";
export const FIELD_USER_NAME = "Name"; // Assuming Name is the API name for the user's Name field
export const FIELD_USER_ROLE = "Role"; // Assuming Role is the API name

// Stage Fields
export const FIELD_STAGE_ACTIVE_STATUS = "Active_Status";
export const FIELD_STAGE_NAME = "Stage_Name";
export const FIELD_STAGE_VIEW = "Stage_View";
export const FIELD_STAGE_ORDER = "Stage_Order";
export const FIELD_STAGE_ID = "ID"; // System field

// Tag Fields
export const FIELD_TAG_ACTIVE_STATUS = "Active_Status";
export const FIELD_TAG_NAME = "Tag_Name";
export const FIELD_TAG_COLOR = "Tag_Color";
export const FIELD_TAG_CATEGORY = "Category";
export const FIELD_TAG_DESCRIPTION = "Tag_Description";
export const FIELD_TAG_ID = "ID"; // System field

// Sales Rep Fields
export const FIELD_SALES_REP_NAME = "Name";
export const FIELD_SALES_REP_ID = "ID"; // System field

// Sales Org Fields
export const FIELD_SALES_ORG_NAME = "Org_Name";
export const FIELD_SALES_ORG_ID = "ID"; // System field

// Tranche Fields
export const FIELD_TRANCHE_NUMBER = "Tranche_Number";
export const FIELD_TRANCHE_ID = "ID"; // System field

// Add other important field API names

// --- Other Constants ---
export const DEFAULT_SORT_FIELD = 'Owner_Name_Display';
export const DEFAULT_SORT_DIRECTION = 'asc'; 