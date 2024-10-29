import React, { useState } from 'react';
import { Stack } from 'expo-router';
import {
	StyleSheet,
	View,
	Image,
	ActivityIndicator,
	Text,
	TouchableOpacity,
	Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function Home() {
	const [image, setImage] = useState<string | null>(null);
	const [apiResult, setApiResult] = useState<any>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1
		});

		if (!result.canceled) {
			setImage(result.assets[0].uri);
			setApiResult(null);
		}
	};

	// Convert image URI to base64
	const getBase64FromUri = async (uri: string): Promise<string> => {
		const base64 = await FileSystem.readAsStringAsync(uri, {
			encoding: FileSystem.EncodingType.Base64
		});
		return `data:image/jpeg;base64,${base64}`;
	};

	const processImage = async () => {
		if (!image) return;

		const base64Image = await getBase64FromUri(image);

		setIsProcessing(true);
		try {
			const response = await fetch('/api/process', {
				method: 'POST',
				body: JSON.stringify({ imageUri: base64Image }),
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await response.json();
			if (result.result) {
				setApiResult(result.result);
			}
		} catch (error) {
			setApiResult({ error: 'Failed to process image' });
		} finally {
			setIsProcessing(false);
		}
	};

	const saveGeneratedImage = async () => {
		if (apiResult) {
			try {
				const base64 = apiResult.split('data:image/png;base64,')[1];

				const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

				if (status !== 'granted') {
					alert('Sorry, we need camera roll permissions to save the image.');
					return;
				}
				const filename = FileSystem.documentDirectory + `${new Date().getTime()}.jpg`;

				await FileSystem.writeAsStringAsync(filename, `${base64}`, {
					encoding: FileSystem.EncodingType.Base64
				});

				await MediaLibrary.saveToLibraryAsync(filename);

				Alert.alert('Success', 'Image saved to your photos!');
			} catch (error) {
				console.error('Error saving image:', error);
				alert('Failed to save the image.');
			}
		}
	};

	return (
		<View style={styles.container}>
			<Stack.Screen options={{ title: 'Image Processor' }} />
			<TouchableOpacity onPress={pickImage} style={styles.button}>
				<Text style={styles.buttonText}>Pick an image</Text>
			</TouchableOpacity>

			{image && (
				<View style={styles.imageContainer}>
					<Image source={{ uri: image }} style={styles.image} />
					<TouchableOpacity onPress={processImage} style={styles.button} disabled={isProcessing}>
						<Text style={styles.buttonText}>
							{isProcessing ? 'Processing...' : 'Process Image'}
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{isProcessing && <ActivityIndicator size="large" color="#0000ff" />}

			{apiResult && (
				<View style={styles.resultContainer}>
					<Text style={styles.resultTitle}>Processed Image:</Text>
					<TouchableOpacity onPress={saveGeneratedImage}>
						<Image source={{ uri: apiResult }} style={styles.resultImage} resizeMode="contain" />
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20
	},
	button: {
		backgroundColor: '#007AFF',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		marginVertical: 10,
		alignItems: 'center'
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center'
	},
	imageContainer: {
		alignItems: 'center',
		marginTop: 20
	},
	image: {
		width: 300,
		height: 225,
		borderRadius: 8,
		marginBottom: 10,
		resizeMode: 'contain'
	},
	resultContainer: {
		marginTop: 20,
		padding: 10,
		backgroundColor: '#f0f0f0',
		borderRadius: 8,
		width: '100%',
		alignItems: 'center'
	},
	resultTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
		textAlign: 'center'
	},
	resultText: {
		fontSize: 14,
		textAlign: 'center'
	},
	resultImage: {
		width: 300,
		height: 225,
		borderRadius: 8,
		marginBottom: 10
	}
});