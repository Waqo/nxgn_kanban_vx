/**
 * Centralized UI options for dropdowns, button groups, etc.
 */

// Filter Type Dropdown Options (KanbanToolbar)
export const FILTER_TYPE_OPTIONS = [
    { value: 'tags', label: 'Tags' },
    { value: 'salesRep', label: 'Sales Rep' },
    { value: 'salesOrg', label: 'Sales Org' },
    { value: 'projectType', label: 'Project Type' },
    // { value: 'workRequired', label: 'Work Required' }, // Work Required is now a separate button group
];

// Options for Project Type Filter (KanbanToolbar - used when FILTER_TYPE_OPTIONS selects 'projectType')
export const PROJECT_TYPE_OPTIONS = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
];

// Options for Work Required Filter (KanbanToolbar - now a button group)
export const WORK_REQUIRED_OPTIONS = [
    { value: 'tree', label: 'Tree' },
    { value: 'roof', label: 'Roof' },
    { value: 'panel', label: 'Panel Upgrade' }, // Assuming 'panel' is the value used in store
];

// Sort By Dropdown Options (KanbanToolbar)
// Raw options without the "Sort By " prefix, which is added in the component computed prop
export const SORT_BY_OPTIONS = [
    { value: 'Owner_Name_Display', label: 'Owner Name' },
    { value: 'address', label: 'Address' },
    { value: 'Sales_Rep_Name', label: 'Sales Rep' },
    { value: 'kW_STC', label: 'System Size (kW)' },
    { value: 'Yield', label: 'Yield (kWh/kWp)' },
    { value: 'Date_Sold', label: 'Date Sold' },
    { value: 'Installation_Date_Time', label: 'Install Date' },
    { value: 'Added_Time', label: 'Date Added' },
    { value: 'Modified_Time', label: 'Last Modified' },
    // Add other sortable fields as needed
];

// Stage View Toggle Options (KanbanToolbar)
export const STAGE_VIEW_OPTIONS = [
    { value: 'all', label: 'All Stages' },
    { value: 'sales', label: 'Sales View' },
    { value: 'install', label: 'Install View' }
];

// --- ADD Event Types Definition (based on old EventsSection.js) ---
export const EVENT_TYPES = [
    {
        type: "Site Survey",
        bookingField: "Survey_Date_Time",       // API Name for booking date/time
        statusField: "Survey_Status",         // API Name for status picklist
        possibleStatuses: ["TBD", "Needs Scheduling", "Scheduled", "Completed", "Not Required"]
    },
    {
        type: "Tree Work",
        bookingField: "Tree_Work_Date_Time",
        statusField: "Tree_Work_Status",
        possibleStatuses: ["TBD", "Not Required", "Needs Scheduling", "Scheduled", "Completed"]
    },
    {
        type: "Roof Work",
        bookingField: "Roof_Work_Date_Time",
        statusField: "Roof_Work_Status",
        possibleStatuses: ["TBD", "Not Required", "Needs Scheduling", "Scheduled", "Completed"]
    },
    {
        type: "Panel Upgrade",
        bookingField: "PU_Work_Date_Time",
        statusField: "PU_Work_Status",
        possibleStatuses: ["TBD", "Not Required", "Needs Scheduling", "Scheduled", "Completed"]
    },
    {
        type: "Installation",
        bookingField: "Installation_Date_Time",
        statusField: "Installation_Status",
        possibleStatuses: ["TBD", "Needs Scheduling", "Scheduled", "In Progress", "Completed", "Cancelled"]
    },
    {
        type: "Final Inspection",
        bookingField: "Final_Inspection_Date_Time",
        statusField: "Final_Inspection_Status",
        possibleStatuses: ["TBD", "Needs Scheduling", "Scheduled", "Completed", "Not Required", "Failed"]
    },
];

// Roles allowed for user lists (e.g., impersonation, tagging)
export const TEAM_USER_ROLES = ['Project Manager', 'Admin', 'Executive'];

// Add other sets of static options as needed
// Example:
// export const DEFAULT_NOTIFICATION_DURATION = 5000; 

// --- ADD Contact Type Options ---
export const CONTACT_TYPE_OPTIONS = [
    'Owner 1',
    'Owner 2',
    'Other Project Contact'
]; 

// --- REMOVE Static Email Template Options ---
/*
export const EMAIL_TEMPLATES = [
    {
        id: 'contract',
        name: 'Info Request: Contract',
        description: 'Request information needed for contract',
        template: 'Info Request: Contract' // This is the Email_Subject value sent to Zoho
    },
    {
        id: 'utility',
        name: 'Info Request: Utility Bill',
        description: 'Request utility bill from customer',
        template: 'Info Request: Utility Bill'
    },
    {
        id: 'finance',
        name: 'Info Request: Finance',
        description: 'Request financial information',
        template: 'Info Request: Finance'
    },
    {
        id: 'permit',
        name: 'Permit/Interconnection Submitted',
        description: 'Notify customer of permit submission',
        template: 'Permit/Interconnection Submitted'
    },
    {
        id: 'install-booking',
        name: 'Ready For Installation Booking',
        description: 'Schedule installation appointment',
        template: 'Ready For Installation Booking'
    },
    {
        id: 'install-complete',
        name: 'Install Complete',
        description: 'Confirm installation completion',
        template: 'Install Complete'
    },
    {
        id: 'pto',
        name: 'PTO',
        description: 'Permission to Operate notification',
        template: 'PTO'
    },
    {
        id: 'survey-reminder',
        name: 'Site Survey Reminder',
        description: 'Remind customer to schedule their site survey appointment',
        template: 'Site Survey Reminder'
    },
    {
        id: 'not-viable',
        name: 'Project Not Viable',
        description: 'Notify customer that their project is not viable',
        template: 'Project Not Viable'
    }
]; 
*/ 