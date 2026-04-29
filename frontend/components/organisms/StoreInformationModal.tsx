import { useMemo, useState } from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppThemeColors, Fonts } from '@/constants/theme';
import { useRestaurantStore } from '@/stores/restaurantStore';

export interface StoreInformationModalProps {
    visible: boolean;
    onClose: () => void;
    currentDescription?: string;
    currentImages?: string[];
}

export default function StoreInformationModal({
    visible,
    onClose,
    currentDescription = '',
    currentImages = [],
}: StoreInformationModalProps) {
    const Colors = useAppThemeColors();
    const { updateProfile, profileLoading, error: storeError } = useRestaurantStore();

    const [description, setDescription] = useState(currentDescription);
    const [selectedImages, setSelectedImages] = useState<string[]>(currentImages);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                modalOverlay: {
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'flex-end',
                },
                modalContent: {
                    backgroundColor: Colors.background,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    maxHeight: '90%',
                    paddingTop: 16,
                },
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                },
                headerTitle: {
                    fontFamily: Fonts.brandBlack,
                    fontSize: 18,
                    color: Colors.text,
                },
                closeButton: {
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: Colors.card,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                scrollContent: {
                    padding: 20,
                },
                section: {
                    marginBottom: 24,
                },
                sectionTitle: {
                    fontFamily: Fonts.brandBold,
                    fontSize: 14,
                    color: Colors.text,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                },
                imageGrid: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 12,
                },
                imageCard: {
                    width: '48%',
                    aspectRatio: 1,
                    borderRadius: 12,
                    backgroundColor: Colors.card,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    overflow: 'hidden',
                    position: 'relative',
                },
                image: {
                    width: '100%',
                    height: '100%',
                },
                removeImageButton: {
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#EF4444',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                addImageButton: {
                    width: '48%',
                    aspectRatio: 1,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: Colors.primary,
                    borderStyle: 'dashed',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: Colors.card,
                },
                addImageContent: {
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                },
                addImageText: {
                    fontFamily: Fonts.brandBold,
                    fontSize: 12,
                    color: Colors.primary,
                    textAlign: 'center',
                },
                descriptionLabel: {
                    fontFamily: Fonts.brandBold,
                    fontSize: 12,
                    color: Colors.muted,
                    marginBottom: 8,
                },
                descriptionInput: {
                    backgroundColor: Colors.card,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: 12,
                    padding: 12,
                    fontFamily: Fonts.brand,
                    fontSize: 14,
                    color: Colors.text,
                    minHeight: 100,
                    textAlignVertical: 'top',
                },
                descriptionCounter: {
                    fontFamily: Fonts.brand,
                    fontSize: 11,
                    color: Colors.muted,
                    marginTop: 6,
                    textAlign: 'right',
                },
                errorMessage: {
                    backgroundColor: '#FEE2E2',
                    borderLeftWidth: 4,
                    borderLeftColor: '#EF4444',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                },
                errorText: {
                    fontFamily: Fonts.brand,
                    fontSize: 12,
                    color: '#DC2626',
                },
                footer: {
                    flexDirection: 'row',
                    gap: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                },
                cancelButton: {
                    flex: 1,
                    paddingVertical: 12,
                    borderWidth: 1.5,
                    borderColor: Colors.border,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                cancelButtonText: {
                    fontFamily: Fonts.brandBold,
                    fontSize: 14,
                    color: Colors.text,
                },
                submitButton: {
                    flex: 1,
                    paddingVertical: 12,
                    backgroundColor: Colors.primary,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                },
                submitButtonText: {
                    fontFamily: Fonts.brandBold,
                    fontSize: 14,
                    color: '#FFFFFF',
                },
                disabledButton: {
                    opacity: 0.6,
                },
            }),
        [Colors],
    );

    const pickImage = async () => {
        try {
            setLocalError(null);

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please allow access to your photo library');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                console.log('📸 Image selected:', asset.uri);

                // Use the URI directly (Expo handles base64 conversion internally)
                // The image URI is already in a format the backend can handle
                const imageUri = asset.uri;

                // Check if it's already a base64 data URI
                if (imageUri.startsWith('data:')) {
                    // Already base64
                    setSelectedImages([...selectedImages, imageUri]);
                } else {
                    // It's a file URI - add it directly
                    // The backend will receive it as a file path that Expo can handle
                    setSelectedImages([...selectedImages, imageUri]);
                }

                console.log('🖼️ Image added. Total images:', selectedImages.length + 1);
            }
        } catch (err: any) {
            console.error('❌ Image pick error:', err);
            setLocalError(err.message || 'Failed to pick image');
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setLocalError(null);

            // Validation
            if (description.trim().length < 10) {
                setLocalError('Description must be at least 10 characters');
                return;
            }

            if (description.trim().length > 500) {
                setLocalError('Description cannot exceed 500 characters');
                return;
            }

            if (selectedImages.length === 0) {
                setLocalError('Please add at least one image');
                return;
            }

            setIsSubmitting(true);

            console.log('📤 Sending update with:', {
                description: description.trim(),
                images: selectedImages.length,
            });

            await updateProfile({
                description: description.trim(),
                image: selectedImages,
            });

            Alert.alert('Success', 'Store information updated successfully');
            onClose();
        } catch (err: any) {
            console.error('❌ Submit error:', err);
            setLocalError(err.message || 'Failed to update store information');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayError = storeError || localError;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Store Information</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            disabled={isSubmitting || profileLoading}
                        >
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Error Message */}
                        {displayError && (
                            <View style={styles.errorMessage}>
                                <Text style={styles.errorText}>{displayError}</Text>
                            </View>
                        )}

                        {/* Images Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Restaurant Images</Text>
                            <View style={styles.imageGrid}>
                                {selectedImages.map((image, index) => (
                                    <View key={index} style={styles.imageCard}>
                                        <Image
                                            source={{ uri: image }}
                                            style={styles.image}
                                        />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => removeImage(index)}
                                            disabled={isSubmitting || profileLoading}
                                        >
                                            <Ionicons name="trash" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {/* Add Image Button */}
                                {selectedImages.length < 5 && (
                                    <TouchableOpacity
                                        style={styles.addImageButton}
                                        onPress={pickImage}
                                        disabled={isSubmitting || profileLoading}
                                    >
                                        <View style={styles.addImageContent}>
                                            <Ionicons
                                                name="cloud-upload-outline"
                                                size={28}
                                                color={Colors.primary}
                                            />
                                            <Text style={styles.addImageText}>Add Image</Text>
                                            <Text
                                                style={[
                                                    styles.addImageText,
                                                    { fontSize: 10, color: Colors.muted },
                                                ]}
                                            >
                                                ({selectedImages.length}/5)
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Description Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.descriptionLabel}>
                                Tell customers about your restaurant
                            </Text>
                            <TextInput
                                style={styles.descriptionInput}
                                placeholder="e.g., Award-winning Italian restaurant with authentic recipes..."
                                placeholderTextColor={Colors.muted}
                                value={description}
                                onChangeText={setDescription}
                                maxLength={500}
                                multiline
                                editable={!isSubmitting && !profileLoading}
                            />
                            <Text style={styles.descriptionCounter}>
                                {description.length}/500
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isSubmitting || profileLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (isSubmitting || profileLoading) && styles.disabledButton,
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || profileLoading}
                        >
                            {isSubmitting || profileLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                    <Text style={styles.submitButtonText}>Save</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}