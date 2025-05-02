import BaseSelectMenu from '../../../common/BaseSelectMenu.js';
import BaseTextInput from '../../../common/BaseTextInput.js';
import BaseButton from '../../../common/BaseButton.js';
import { useMaterialStore } from '../../../../store/materialStore.js';
import { useLookupsStore } from '../../../../store/lookupsStore.js';
import { formatCurrency } from '../../../../utils/helpers.js';
import { useUiStore } from '../../../../store/uiStore.js';

const { ref, reactive, computed, watch, onMounted, watchEffect } = Vue;

// Helper to get empty form structure
function getEmptyMaterialForm() {
    return {
        category: null, 
        manufacturer: null,
        model: null,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
    };
}

export default {
    name: 'MaterialForm',
    components: {
        BaseSelectMenu,
        BaseTextInput,
        BaseButton
    },
    props: {
        isEditing: { type: Boolean, default: false },
        initialData: { type: Object, default: () => ({}) },
        projectId: { type: String, required: true }
    },
    emits: ['submit', 'cancel'],
    setup(props, { emit }) {
        const materialStore = useMaterialStore();
        const lookupsStore = useLookupsStore();
        const uiStore = useUiStore();

        const isSaving = ref(false);
        const equipmentData = computed(() => lookupsStore.equipmentData || {});
        
        const formData = reactive(getEmptyMaterialForm());

        watch(() => [props.initialData, props.isEditing], ([newData, editing]) => {
            if (editing && newData && newData.ID) {
                Object.assign(formData, {
                     category: newData.Category || null,
                     manufacturer: newData.Manufacturer || null,
                     model: newData.Model || null,
                     quantity: newData.Quantity || 1,
                     unitPrice: newData.Unit_Price || 0,
                     totalPrice: newData.Total_Price || 0
                });
            } else {
                 Object.assign(formData, getEmptyMaterialForm());
            }
        }, { immediate: true, deep: true });

        const categoryOptions = computed(() => {
            if (!equipmentData.value || Object.keys(equipmentData.value).length === 0) return [];
            const options = Object.keys(equipmentData.value).map(cat => ({ value: cat, label: cat }));
            console.log('MaterialForm: categoryOptions:', options);
            return options;
        });

        const availableManufacturers = computed(() => {
            if (!formData.category || !equipmentData.value || !equipmentData.value[formData.category]) return [];
            const manufacturers = [...new Set(equipmentData.value[formData.category].map(item => item.manufacturer))];
            const options = manufacturers.map(m => ({ value: m, label: m }));
            console.log('MaterialForm: availableManufacturers for', formData.category, ':', options);
            return options;
        });

        const availableModels = computed(() => {
            if (!formData.manufacturer || !formData.category || !equipmentData.value || !equipmentData.value[formData.category]) return [];
            const models = equipmentData.value[formData.category]
                .filter(item => item.manufacturer === formData.manufacturer)
                .map(item => ({ value: item.model, label: item.model, cost: item.cost }));
            console.log('MaterialForm: availableModels for', formData.manufacturer, ':', models);
            return models;
        });

        watch(() => formData.category, (newValue) => {
            console.log('MaterialForm WATCH: Category changed to:', newValue);
            if (!props.isEditing || newValue !== props.initialData?.Category) {
                formData.manufacturer = null;
                formData.model = null;
                formData.unitPrice = 0;
                formData.totalPrice = 0;
            }
        });

        watch(() => formData.manufacturer, (newValue) => {
            console.log('MaterialForm WATCH: Manufacturer changed to:', newValue);
            if (!props.isEditing || newValue !== props.initialData?.Manufacturer) {
                formData.model = null;
                formData.unitPrice = 0;
                formData.totalPrice = 0;
            }
        });
        
        watch(() => formData.model, (newModelValue) => {
            console.log('MaterialForm WATCH: Model changed to:', newModelValue);
            const selectedModelData = availableModels.value.find(m => m.value === newModelValue);
            formData.unitPrice = selectedModelData?.cost || 0;
        });

        watch([() => formData.quantity, () => formData.unitPrice], ([newQty, newUnitPrice]) => {
            formData.totalPrice = (Number(newQty) || 0) * (Number(newUnitPrice) || 0);
        });

        const formattedUnitPrice = computed(() => formatCurrency(formData.unitPrice));
        const formattedTotalPrice = computed(() => formatCurrency(formData.totalPrice));

        const cancelForm = () => {
            if (!isSaving.value) {
                emit('cancel');
            }
        };

        const handleSubmit = async () => {
            const uiStore = useUiStore();
            if (!formData.category || !formData.manufacturer || !formData.model || !formData.quantity || formData.quantity <= 0) {
                 console.error("Material form validation failed");
                 uiStore.addNotification({ 
                     type: 'error', 
                     message: 'Please fill in all required material fields (Category, Manufacturer, Model, Quantity).' 
                 }); 
                 return;
            }
            
            isSaving.value = true;
            try {
                if (props.isEditing) {
                    await materialStore.updateMaterial({
                        materialId: props.initialData.ID,
                        materialData: { ...formData }
                    });
                } else {
                    await materialStore.addMaterial({
                        projectId: props.projectId,
                        materialData: { ...formData } 
                    });
                }
                emit('submit');
            } catch (error) {
                console.error('MaterialForm: Submit failed', error);
            } finally {
                isSaving.value = false;
            }
        };
        
        watchEffect(() => {
            if (!equipmentData.value || Object.keys(equipmentData.value).length === 0) {
                if (!lookupsStore.isLoadingEquipment) {
                    console.log('MaterialForm: Equipment data missing or empty, triggering fallback fetch.');
                    lookupsStore.fetchEquipmentFallback();
                }
            }
        });

        return {
            formData,
            categoryOptions,
            availableManufacturers,
            availableModels,
            formattedUnitPrice,
            formattedTotalPrice,
            isSaving,
            handleSubmit,
            cancelForm
        };
    },
    template: `
        <form @submit.prevent="handleSubmit" class="space-y-4 p-4 border border-blue-200 rounded-md bg-blue-50 shadow-sm mb-4">
            <h4 class="text-md font-semibold text-gray-800 mb-2">{{ isEditing ? 'Edit Material' : 'Add New Material' }}</h4>
            
             <base-select-menu
                label="Category"
                :options="categoryOptions"
                v-model="formData.category"
                placeholder="Select Category..."
                required
                :disabled="isEditing" 
            />
             <base-select-menu
                label="Manufacturer"
                :options="availableManufacturers"
                v-model="formData.manufacturer"
                placeholder="Select Manufacturer..."
                :disabled="!formData.category || categoryOptions.length === 0"
                required
            />
             <base-select-menu
                label="Model"
                :options="availableModels"
                v-model="formData.model"
                placeholder="Select Model..."
                :disabled="!formData.manufacturer || availableManufacturers.length === 0"
                option-label-key="label" 
                option-value-key="value"
                required
            />
            <base-text-input
                label="Quantity"
                type="number"
                v-model.number="formData.quantity"
                :attrs="{ min: 1 }"
                required
            />
             <div>
                <label class="block text-sm font-medium text-gray-700">Cost per Unit</label>
                 <p class="mt-1 text-sm text-gray-900 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-300 min-h-[36px]">{{ formattedUnitPrice }}</p>
             </div>
             <div>
                <label class="block text-sm font-medium text-gray-700">Total Cost</label>
                 <p class="mt-1 text-sm text-gray-900 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-300 min-h-[36px]">{{ formattedTotalPrice }}</p>
             </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-blue-100">
                 <base-button @click="cancelForm" variant="secondary" type="button" :disabled="isSaving">Cancel</base-button>
                 <base-button type="submit" variant="primary" :disabled="isSaving || !formData.model">
                    <span v-if="isSaving">
                        <i class="fas fa-spinner fa-spin mr-1"></i> Saving...
                    </span>
                     <span v-else>{{ isEditing ? 'Save Changes' : 'Add Material' }}</span>
                 </base-button>
            </div>
        </form>
    `
}; 