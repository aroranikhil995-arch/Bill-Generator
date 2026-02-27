import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { useAlertStore } from '../store/alertStore';
import { Colors, Radius, Shadow, FontSize } from '../theme/colors';

export default function CustomAlert() {
    const { visible, title, message, buttons, hideAlert } = useAlertStore();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <TouchableWithoutFeedback onPress={hideAlert}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.dialog}>
                            {/* Header */}
                            <Text style={styles.title}>{title}</Text>

                            {/* Message */}
                            {!!message && <Text style={styles.message}>{message}</Text>}

                            {/* Actions */}
                            <View style={styles.actionsContainer}>
                                {buttons && buttons.map((btn, index) => {
                                    const isCancel = btn.style === 'cancel';
                                    const isDestructive = btn.style === 'destructive';

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.button,
                                                isCancel ? styles.buttonCancel : isDestructive ? styles.buttonDestructive : styles.buttonPrimary,
                                                buttons.length > 1 && { flex: 1 }
                                            ]}
                                            onPress={() => {
                                                hideAlert();
                                                setTimeout(() => { // slight delay before executing callback
                                                    if (btn.onPress) btn.onPress();
                                                }, 150);
                                            }}
                                        >
                                            <Text style={[
                                                styles.buttonText,
                                                isCancel && styles.buttonTextCancel
                                            ]}>
                                                {btn.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(59, 31, 14, 0.6)', // Deep semi-transparent brand color
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialog: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 24,
        alignItems: 'center',
        ...Shadow.card,
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    actionsContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        justifyContent: 'center',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    buttonPrimary: {
        backgroundColor: Colors.accent,
    },
    buttonCancel: {
        backgroundColor: '#FFF0E5',
    },
    buttonDestructive: {
        backgroundColor: '#FFE5E5',
    },
    buttonText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.surface,
    },
    buttonTextCancel: {
        color: Colors.accent,
    },
});
