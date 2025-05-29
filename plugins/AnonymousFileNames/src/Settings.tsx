import { React, ReactNative } from '@vendetta/metro/common';
import { Forms } from '@vendetta/ui/components';
import { useProxy } from '@vendetta/storage';
import { storage } from '@vendetta/plugin';
import { getAssetIDByName } from '@vendetta/ui/assets';
import randomString from './lib/randomString';

const { FormInput, FormRow, FormText } = Forms;

const MIN_LENGTH = 1;
const MAX_LENGTH = 20;

export default () => {
    useProxy(storage);

    const [inputValue, setInputValue] = React.useState(storage.nameLength?.toString() || '8');
    const [error, setError] = React.useState<string | null>(null);

    const validateAndUpdate = (value: string) => {
        setInputValue(value);

        const numericValue = value.replace(/[^0-9]/g, '');

        if (numericValue === '') {
            setError('File name length is required');
            return;
        }

        const length = parseInt(numericValue);

        if (length < MIN_LENGTH) {
            setError(`Minimum length is ${MIN_LENGTH}`);
            return;
        }

        if (length > MAX_LENGTH) {
            setError(`Maximum length is ${MAX_LENGTH}`);
            return;
        }

        // Valid input
        setError(null);
        storage.nameLength = length;
        setInputValue(numericValue);
    };

    const getPreviewName = () => {
        const length = parseInt(inputValue) || 8;
        const validLength = Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, length));
        return randomString(validLength);
    };

    return (
        <ReactNative.ScrollView style={{ flex: 1 }}>
            <Forms.FormSection title="File Name Settings">
                <FormInput
                    title="File name length"
                    placeholder="8"
                    keyboardType="numeric"
                    maxLength={2}
                    value={inputValue}
                    onChange={validateAndUpdate}
                    error={error}
                />

                <FormRow
                    label="Range"
                    trailing={
                        <FormText>
                            {MIN_LENGTH} - {MAX_LENGTH} characters
                        </FormText>
                    }
                    leading={<FormRow.Icon source={getAssetIDByName('ic_info_filled_16px')} />}
                />

                <FormRow
                    label="Preview"
                    trailing={<FormText style={{ fontFamily: 'monospace' }}>{getPreviewName()}.jpg</FormText>}
                    leading={<FormRow.Icon source={getAssetIDByName('ic_eye_24px')} />}
                />
            </Forms.FormSection>

            <Forms.FormSection title="How it works">
                <FormText
                    style={{
                        marginHorizontal: 16,
                        marginVertical: 8,
                        opacity: 0.7,
                        fontSize: 14,
                        lineHeight: 20
                    }}
                >
                    When you upload files, their names will be replaced with random {inputValue || '8'}-character
                    strings using letters and numbers. The file extension will be preserved.
                </FormText>

                <FormText
                    style={{
                        marginHorizontal: 16,
                        marginBottom: 8,
                        opacity: 0.6,
                        fontSize: 12,
                        fontStyle: 'italic'
                    }}
                >
                    Example: "my-secret-document.pdf" → "{getPreviewName()}.pdf"
                </FormText>
            </Forms.FormSection>
        </ReactNative.ScrollView>
    );
};
