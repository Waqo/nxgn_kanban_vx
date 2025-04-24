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
    { value: 'commercial', label: 'Commercial' },
    { value: 'residential', label: 'Residential' },
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
    { value: 'Owner_Name_Display', label: 'Contact Name' },
    { value: 'Date_Sold', label: 'Date Sold' },
    { value: 'Added_Time', label: 'Added Time' },
    { value: 'Modified_Time', label: 'Modified Time' },
    { value: 'kW_STC', label: 'System Size' },
    { value: 'Yield', label: 'Yield' },
    { value: 'installationBooking', label: 'Install Date' }
];

// Stage View Toggle Options (KanbanToolbar)
export const STAGE_VIEW_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'sales', label: 'Sales' },
    { value: 'install', label: 'Install' }
];

// --- ADD Event Types Definition (based on old EventsSection.js) ---
export const EVENT_TYPES = [
    {
        type: "Site Survey",
        bookingField: "Survey_Date_Time",       // API Name for booking date/time
        statusField: "Survey_Status",         // API Name for status picklist
        possibleStatuses: ["Needs Scheduling", "Scheduled", "Completed", "TBD"]
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
        possibleStatuses: ["Needs Scheduling", "Scheduled", "Completed", "TBD"]
    },
    {
        type: "Final Inspection",
        bookingField: "Final_Inspection_Date_Time",
        statusField: "Final_Inspection_Status",
        possibleStatuses: ["Needs Scheduling", "Scheduled", "Completed", "TBD"]
    }
];

// Add other sets of static options as needed
// Example:
// export const DEFAULT_NOTIFICATION_DURATION = 5000; 