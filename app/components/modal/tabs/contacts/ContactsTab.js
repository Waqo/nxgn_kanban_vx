// app/components/modal/tabs/contacts/ContactsTab.js

// Import necessary Base components 
// import BaseStackedList from '../../../common/BaseStackedList.js'; // No longer needed
// import BaseAvatar from '../../../common/BaseAvatar.js'; // Moved to ContactCard
// import BaseButton from '../../../common/BaseButton.js'; // Removed - Globally Registered
// import BaseBadge from '../../../common/BaseBadge.js'; // Moved to ContactCard
// import BaseTextInput from '../../../common/BaseTextInput.js'; // Not used
// import BaseSelectMenu from '../../../common/BaseSelectMenu.js'; // Not used
// import BaseGridList from '../../../common/BaseGridList.js'; // Removed - Globally Registered
// --- ADD Import for ContactCard --- 
import ContactCard from './ContactCard.js'; 
// *** ADD Import for ContactForm ***
import ContactForm from './ContactForm.js';

// --- Import Options/Stores ---
// import { CONTACT_TYPE_OPTIONS } from '../../../../config/options.js'; // Not used
import { useContactsStore } from '../../../../store/contactsStore.js'; 
import { useUiStore } from '../../../../store/uiStore.js';

// Vuex no longer needed
// if (typeof Vuex === 'undefined') { ... }

// --- ADD Import for Vue reactivity helpers if needed ---
// const { ref, reactive } = Vue; // REMOVED - Not needed now

const ContactsTab = {
    name: 'ContactsTab',
    components: {
        // Base components are globally registered
        // BaseButton, // Removed
        // BaseGridList, // Removed
        // --- Register ContactCard ---
        ContactCard,
        // *** Register ContactForm ***
        ContactForm
    },
    // Define the project prop
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    // --- ADD Local State --- 
    data() {
        return {
            isAddingContact: false,
            isEditingContactId: null,
            editedContactForm: this.getEmptyContactForm(), // Keep temporarily for passing initial data
            confirmingAction: null, 
            // *** ADD isSubmitting state ***
            isSubmitting: false
        };
    },
    computed: {
        // Get the contacts array from the prop
        contacts() {
            // console.log('ContactsTab: Contacts from prop:', this.project.Contacts);
            // *** Implement new sorting logic ***
            const contactsToSort = this.project?.Contacts || [];
          // console.log('ContactsTab: ContactData:', contactsToSort);
            return contactsToSort.slice().sort((a, b) => {
                const typeOrder = {
                    'Owner 1': 1,
                    'Owner 2': 2
                };
                const orderA = typeOrder[a.Primary_Contact_Type1] || 3;
                const orderB = typeOrder[b.Primary_Contact_Type1] || 3;

                if (orderA !== orderB) {
                    return orderA - orderB;
                } else {
                    // *** FIX: Replicate name formatting inline ***
                    const nameA = (`${a.Name?.first_name || ''} ${a.Name?.last_name || ''}`.trim() || 'Unnamed Contact').toLowerCase();
                    const nameB = (`${b.Name?.first_name || ''} ${b.Name?.last_name || ''}`.trim() || 'Unnamed Contact').toLowerCase();
                    return nameA.localeCompare(nameB);
                }
            });
        },
        // Filtered contacts (implement later if needed)
        // filteredContacts() { ... }

        // Options for contact type dropdown
        contactTypes() {
            // *** FIX: Filter out 'Owner 1' ***
            return CONTACT_TYPE_OPTIONS
                .filter(type => type !== 'Owner 1') // Exclude 'Owner 1'
                .map(type => ({ value: type, label: type }));
        },
        // *** ADD Computed for Main Owner ID ***
        mainOwnerContactId() {
            return this.project?.Owner_Name?.ID || null;
        }
    },
    methods: {
        // --- ADD Helper to get empty form structure --- 
        getEmptyContactForm() {
             return {
                First_Name: '',
                Last_Name: '',
                Primary_Contact_Type1: null,
                Email: '',
                Phone_Number: '',
                Mobile_Phone_Number: '',
                Business_POC: false,
                Job_Title: '',
                Business_Name: '',
                // Billing Address (optional structure)
                showBillingAddress: false,
                Billing_Address_1: '',
                Billing_Address_2: '',
                Billing_City: '',
                Billing_State: '',
                Billing_Zip: '',
            };
        },
        // --- ADD Form Toggling Methods --- 
        toggleAddContactForm() {
            this.isAddingContact = !this.isAddingContact;
            this.isEditingContactId = null; 
            this.confirmingAction = null; 
        },
        startEditing(contactId) {
            const contact = this.contacts.find(c => c.ID === contactId);
            if (!contact) return;
          // console.log("Start editing contact:", contact);
            // Remove Primary_Contact_Type1 mapping
            this.editedContactForm = {
                First_Name: contact.Name?.first_name || '',
                Last_Name: contact.Name?.last_name || '',
                Email: contact.Email || '',
                Phone_Number: contact.Phone_Number || '',
                Mobile_Phone_Number: contact.Mobile_Phone_Number || '',
                Business_POC: contact.Business_POC === 'true',
                Job_Title: contact.Job_Title || '',
                Business_Name: contact.Business_Name || '',
                showBillingAddress: !!(contact.Billing_Address?.address_line_1 || contact.Billing_Address?.address_line_2 || contact.Billing_Address?.district_city || contact.Billing_Address?.state_province || contact.Billing_Address?.postal_code),
                Billing_Address_1: contact.Billing_Address?.address_line_1 || '',
                Billing_Address_2: contact.Billing_Address?.address_line_2 || '',
                Billing_City: contact.Billing_Address?.district_city || '',
                Billing_State: contact.Billing_Address?.state_province || '',
                Billing_Zip: contact.Billing_Address?.postal_code || '',
            };
            this.isEditingContactId = contact.ID;
            this.isAddingContact = false; 
            this.confirmingAction = null; 
        },
        cancelEditing() {
            this.isEditingContactId = null;
            // No need to reset editedContactForm here, it's passed as prop
            this.confirmingAction = null; 
        },
        
        // --- Update Submit Handlers to receive data from form --- 
        async handleAddContactSubmit(formData) { 
            const contactsStore = useContactsStore();
            this.isSubmitting = true; 
          // console.log('Submitting New Contact from Form:', formData); // formData no longer has Primary_Contact_Type1
            try {
                await contactsStore.addProjectContact({
                    projectId: this.project.ID,
                    contactData: formData // Pass validated data directly
                });
                this.toggleAddContactForm(); 
            } catch (error) {
                console.error("Error caught in component while adding contact:", error);
            } finally {
                this.isSubmitting = false; 
            } 
        },
        async handleEditContactSubmit(formData) { 
            if (!this.isEditingContactId) return;
            
            const contactsStore = useContactsStore();
            this.isSubmitting = true; 
          // console.log('Submitting Edit Contact from Form:', this.isEditingContactId, formData); // formData no longer has Primary_Contact_Type1
             try {
                await contactsStore.updateProjectContact({
                    contactId: this.isEditingContactId,
                    contactData: formData // Pass validated data directly
                });
                 this.cancelEditing(); 
            } catch (error) {
                console.error(`Error caught in component while updating contact ${this.isEditingContactId}:`, error);
            } finally {
                 this.isSubmitting = false; 
            } 
        },
        // --- Execution Methods (called after inline confirm) ---
        async executeDeleteContact(contactId) {
             // *** FIX: Use contactsStore ***
             const contactsStore = useContactsStore();
             const uiStore = useUiStore();
           // console.log('Executing Delete Contact:', contactId);
             try {
                 await contactsStore.deleteProjectContact({ contactId });
                 if (this.isEditingContactId === contactId) {
                     this.cancelEditing(); 
                 }
             } catch (error) {
                 console.error(`Error caught in component while deleting contact ${contactId}:`, error);
             } finally {
                 this.confirmingAction = null; // Reset confirmation after execution
             }
        },
         async executeSetMainOwner(contactId) {
             // *** FIX: Use contactsStore ***
             const contactsStore = useContactsStore();
             const uiStore = useUiStore();
           // console.log('Executing Set Main Owner:', contactId);
             try {
                 await contactsStore.setProjectMainOwner({
                     projectId: this.project.ID,
                     contactId: contactId
                 });
             } catch (error) {
                 console.error(`Error caught in component while setting main owner ${contactId}:`, error);
             } finally {
                 this.confirmingAction = null; // Reset confirmation after execution
             } 
        },

        // --- Set Confirmation State (called by buttons) ---
        requestConfirmation(action, contactId) {
            this.confirmingAction = { action, contactId };
            this.isEditingContactId = null; // Close edit form if open
            this.isAddingContact = false; // Close add form if open
        },
        cancelConfirmation() {
            this.confirmingAction = null;
        },
    },
    template: `
        <div class="contacts-tab-content space-y-6">
            <div class="flex justify-between items-center">
                <div></div>
                <base-button @click="toggleAddContactForm" variant="secondary" size="sm">
                    <span v-if="isAddingContact">Cancel</span>
                    <span v-else>+ Add Contact</span>
                </base-button>
            </div>

            <!-- Add Contact Form -->
            <div v-if="isAddingContact" class="p-4 border border-blue-200 rounded-md bg-blue-50 shadow-sm">
                <h4 class="text-md font-semibold text-gray-800 mb-4">Add New Contact</h4>
                <contact-form 
                    @submit="handleAddContactSubmit"
                    @cancel="toggleAddContactForm"
                    :isLoading="isSubmitting"
                 />
            </div>

            <!-- Contacts List -->
            <div v-if="contacts.length > 0">
                <base-grid-list
                    tag="ul"
                    :cols="1"
                    :sm-cols="2"
                    :gap="6"
                >
                    <li v-for="contact in contacts" :key="contact.ID">
                        <!-- Edit Form Block -->
                        <div v-if="isEditingContactId === contact.ID" class="edit-contact-form border border-indigo-300 rounded-lg p-4 bg-indigo-50 shadow-md">
                            <h4 class="text-md font-semibold text-gray-700 mb-4">Editing: {{ editedContactForm.First_Name }} {{ editedContactForm.Last_Name }}</h4>
                             <contact-form 
                                :initial-data="editedContactForm" 
                                :is-editing="true"
                                @submit="handleEditContactSubmit"
                                @cancel="cancelEditing"
                                :isLoading="isSubmitting"
                             />
                        </div>
                        <!-- Display Block using ContactCard -->
                         <contact-card 
                            v-else 
                            :contact="contact"
                            :main-owner-contact-id="mainOwnerContactId"
                            :is-confirming-action="confirmingAction?.contactId === contact.ID ? confirmingAction : null"
                            @edit="startEditing"
                            @delete-request="requestConfirmation('delete', contact.ID)"
                            @set-owner-request="requestConfirmation('setOwner', contact.ID)"
                            @confirm-action="confirmingAction?.action === 'delete' ? executeDeleteContact(contact.ID) : executeSetMainOwner(contact.ID)"
                            @cancel-confirmation="cancelConfirmation"
                        />
                    </li>
                </base-grid-list>
            </div>
            <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No contacts found for this project.
            </div>
        </div>
    `
};

export default ContactsTab; 