// app/components/modal/tabs/contacts/ContactForm.js

// Import Base Components
// import BaseTextInput from '../../../common/BaseTextInput.js'; // Removed - Globally Registered
// import BaseSelectMenu from '../../../common/BaseSelectMenu.js'; // Not used
// import BaseButton from '../../../common/BaseButton.js'; // Removed - Globally Registered

// Import Options
// import { CONTACT_TYPE_OPTIONS } from '../../../../config/options.js'; // Not used

// Import helper
import { formatAndValidatePhoneNumber } from '../../../../utils/helpers.js';

const { ref, watch, reactive, computed } = Vue; // Assuming Vue is global

export default {
    name: 'ContactForm',
    components: {
      // Base components are globally registered
      // BaseTextInput,
      // BaseButton
    },
    props: {
        initialData: {
            type: Object,
            default: () => ({}) // Default to empty object for Add mode
        },
        isEditing: {
            type: Boolean,
            default: false
        },
        isLoading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['submit', 'cancel'],
    setup(props, { emit }) {
        // Use reactive for the form data object
        const formData = reactive(getEmptyContactForm());
        // Error State Refs for required fields
        const firstNameError = ref(null);
        const lastNameError = ref(null);
        // Remove contactTypeError
        const phoneError = ref(null);
        const mobileError = ref(null);

        // Helper to get empty form structure
        function getEmptyContactForm() {
            return {
                First_Name: '',
                Last_Name: '',
                // Remove Primary_Contact_Type1
                Email: '',
                Phone_Number: '',
                Mobile_Phone_Number: '',
                Business_POC: false,
                Job_Title: '',
                Business_Name: '',
                showBillingAddress: false,
                Billing_Address_1: '',
                Billing_Address_2: '',
                Billing_City: '',
                Billing_State: '',
                Billing_Zip: '',
            };
        }

        // Populate form when initialData changes (for editing)
        watch(() => props.initialData, (newData) => {
            if (newData && Object.keys(newData).length > 0) {
                Object.assign(formData, getEmptyContactForm(), newData);
            } else {
                 Object.assign(formData, getEmptyContactForm()); // Reset
            }
            // Clear errors
            firstNameError.value = null;
            lastNameError.value = null;
            // Remove contactTypeError reset
            phoneError.value = null;
            mobileError.value = null;
        }, { immediate: true, deep: true });

        // Remove contactTypes computed property

        // Validation and Submit Logic
        function submitForm() {
            // Clear previous errors
            firstNameError.value = null;
            lastNameError.value = null;
            // Remove contactTypeError clear
            phoneError.value = null;
            mobileError.value = null;
            let isValid = true;

            // 1. Required field validation (Remove type check)
            if (!formData.First_Name) {
                 firstNameError.value = 'First Name is required.';
                 isValid = false;
            }
            if (!formData.Last_Name) {
                 lastNameError.value = 'Last Name is required.';
                 isValid = false;
            }
            // Remove contact type check

            // 2. Phone validation (Keep existing)
            const phoneValidation = formatAndValidatePhoneNumber(formData.Phone_Number);
            const mobileValidation = formatAndValidatePhoneNumber(formData.Mobile_Phone_Number);
            if (formData.Phone_Number && !phoneValidation.valid) {
                phoneError.value = phoneValidation.error;
                isValid = false;
            }
             if (formData.Mobile_Phone_Number && !mobileValidation.valid) {
                mobileError.value = mobileValidation.error;
                isValid = false;
            }

            if (!isValid) {
                console.warn('Contact form validation failed.');
                return;
            }

            // 3. Prepare data and emit (Remove Primary_Contact_Type1)
            const formDataToSend = { ...formData };
            delete formDataToSend.Primary_Contact_Type1; // Ensure it's not sent
            formDataToSend.Phone_Number = phoneValidation.formatted;
            formDataToSend.Mobile_Phone_Number = mobileValidation.formatted;

            console.log('ContactForm emitting submit:', JSON.parse(JSON.stringify(formDataToSend)));
            emit('submit', formDataToSend);
        }

        function cancelForm() {
            emit('cancel');
        }

        return {
            formData,
            // Remove contactTypes
            submitForm,
            cancelForm,
            firstNameError,
            lastNameError,
            // Remove contactTypeError
            phoneError,
            mobileError
        };
    },
    // Template with corrected HTML comments and BaseSelectMenu error handling
    template: `
        <form @submit.prevent="submitForm" class="space-y-6">
             <div class="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                <div class="sm:col-span-3">
                    <base-text-input
                        label="First Name"
                        v-model="formData.First_Name"
                        :id="(isEditing ? 'edit' : 'new') + '-first-name'"
                        required
                        :error="firstNameError" />
                </div>
                <div class="sm:col-span-3">
                    <base-text-input
                        label="Last Name"
                        v-model="formData.Last_Name"
                        :id="(isEditing ? 'edit' : 'new') + '-last-name'"
                        required
                        :error="lastNameError" />
                </div>

                <!-- Contact Type Dropdown Removed -->

                <div class="sm:col-span-3">
                        <base-text-input
                            label="Email Address"
                            type="email"
                            v-model="formData.Email"
                            :id="(isEditing ? 'edit' : 'new') + '-email'"
                        />
                </div>

                <div class="sm:col-span-3">
                    <base-text-input
                        label="Phone Number"
                        type="tel"
                        v-model="formData.Phone_Number"
                        :id="(isEditing ? 'edit' : 'new') + '-phone'"
                        :error="phoneError"
                    />
                </div>

                <div class="sm:col-span-3">
                    <base-text-input
                        label="Mobile Phone Number"
                        type="tel"
                        v-model="formData.Mobile_Phone_Number"
                        :id="(isEditing ? 'edit' : 'new') + '-mobile-phone'"
                        :error="mobileError"
                    />
                </div>

                <div class="sm:col-span-6">
                    <label class="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            v-model="formData.Business_POC"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 h-4 w-4"
                            :id="(isEditing ? 'edit' : 'new') + '-business-poc'"
                        />
                        <span class="text-gray-700 font-medium">Is Business Point of Contact?</span>
                    </label>
                </div>

                <div v-if="formData.Business_POC" class="sm:col-span-3">
                    <base-text-input
                        label="Job Title"
                        v-model="formData.Job_Title"
                        :id="(isEditing ? 'edit' : 'new') + '-job-title'"
                    />
                </div>

                <div v-if="formData.Business_POC" class="sm:col-span-3">
                    <base-text-input
                        label="Business Name"
                        v-model="formData.Business_Name"
                        :id="(isEditing ? 'edit' : 'new') + '-business-name'"
                    />
                </div>

                <div class="sm:col-span-6">
                    <label class="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            v-model="formData.showBillingAddress"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 h-4 w-4"
                            :id="(isEditing ? 'edit' : 'new') + '-show-billing'"
                        />
                        <span class="text-gray-700 font-medium">{{ isEditing ? 'Edit' : 'Add' }} Billing Address</span>
                    </label>
                </div>

                <template v-if="formData.showBillingAddress">
                    <div class="col-span-full">
                        <base-text-input
                            label="Billing Address Line 1"
                            v-model="formData.Billing_Address_1"
                            :id="(isEditing ? 'edit' : 'new') + '-billing-address-1'"
                        />
                    </div>
                    <div class="col-span-full">
                        <base-text-input
                            label="Billing Address Line 2"
                            v-model="formData.Billing_Address_2"
                            :id="(isEditing ? 'edit' : 'new') + '-billing-address-2'"
                        />
                    </div>
                    <div class="sm:col-span-2">
                        <base-text-input
                            label="Billing City"
                            v-model="formData.Billing_City"
                            :id="(isEditing ? 'edit' : 'new') + '-billing-city'"
                        />
                    </div>
                    <div class="sm:col-span-2">
                        <base-text-input
                            label="Billing State / Province"
                            v-model="formData.Billing_State"
                            :id="(isEditing ? 'edit' : 'new') + '-billing-state'"
                        />
                    </div>
                    <div class="sm:col-span-2">
                        <base-text-input
                            label="Billing ZIP / Postal Code"
                            v-model="formData.Billing_Zip"
                            :id="(isEditing ? 'edit' : 'new') + '-billing-zip'"
                        />
                    </div>
                </template>

            </div>

            <div class="flex justify-end gap-2 pt-4 mt-6 border-t border-gray-200"> <base-button @click="cancelForm" variant="secondary" type="button" :disabled="isLoading">Cancel</base-button>
                <base-button type="submit" variant="primary" :disabled="isLoading">
                    <span v-if="isLoading">
                       <i class="fas fa-spinner fa-spin mr-1"></i> Saving...
                    </span>
                    <span v-else>{{ isEditing ? 'Save Changes' : 'Save Contact' }}</span>
                </base-button>
            </div>
        </form>
    `
};
