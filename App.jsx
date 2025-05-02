import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

const App = () => {
  const camera = useRef(null);
  const [switchCameraValue, setSwitchCameraValue] = useState('front');
  const [flash, setFlash] = useState('off');
  const [showBorder, setShowBorder] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const device = useCameraDevice(switchCameraValue);

  useEffect(() => {
    async function getPermission() {
      // Camera permission
      const cameraPermission = await Camera.requestCameraPermission();
      console.log(`Camera permission status: ${cameraPermission}`);
      if (cameraPermission === 'denied') await Linking.openSettings();

      // Request photo library permission for iOS
      if (Platform.OS === 'ios') {
        const photoLibraryPermission = await Camera.requestPhotoLibraryPermission();
        console.log(`Photo library permission status: ${photoLibraryPermission}`);
        if (photoLibraryPermission === 'denied') await Linking.openSettings();
      } else {
        // For Android, request storage permission
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to your storage to save photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Storage permission denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    }
    getPermission();
  }, []);

  if (device == null) return <View style={styles.loadingContainer} />;

  const capturePhoto = async () => {
    if (camera.current !== null) {
      try {
        const photo = await camera.current.takePhoto({
          flash: switchCameraValue === 'back' ? flash : 'off',
        });
        
        // For iOS, we need to ensure the file URL is in the correct format
        const photoPath = Platform.OS === 'ios' 
          ? photo.path.replace('file://', '') 
          : photo.path;
          
        try {
          await CameraRoll.save(`file://${photoPath}`, {
            type: 'photo',
            album: 'MyAppPhotos',
          });
          console.log('Photo saved successfully!');
          setShowBorder(true);
          setTimeout(() => setShowBorder(false), 1000);
        } catch (saveError) {
          console.log('Failed to save photo:', saveError);
          setSaveError('Failed to save photo. Please check permissions.');
          setTimeout(() => setSaveError(null), 3000);
        }
      } catch (error) {
        console.error('Failed to take photo:', error);
        setSaveError('Failed to capture photo. Please try again.');
        setTimeout(() => setSaveError(null), 3000);
      }
    }
  };

  const onFlashPressed = () => {
    setFlash(prev => (prev === 'off' ? 'on' : 'off'));
  };

  return (
    <View style={[styles.main, {borderWidth: showBorder ? 5 : 0}]}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      {saveError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.touchButton} onPress={capturePhoto}>
        <Entypo name="camera" size={40} color={'white'} />
      </TouchableOpacity>

      <View style={styles.iconHolder}>
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setSwitchCameraValue(prev => (prev === 'back' ? 'front' : 'back'))}>
          <Ionicons name="camera-reverse-outline" size={40} color={'white'} />
        </TouchableOpacity>

        {switchCameraValue === 'back' && (
          <TouchableOpacity style={styles.icon} onPress={onFlashPressed}>
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={40}
              color={'white'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    borderColor: 'green',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  touchButton: {
    backgroundColor: 'red',
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHolder: {
    borderRadius: 15,
    overflow: 'hidden',
    borderColor: 'blue',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    right: 10,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
  },
  icon: {
    borderWidth: 2,
    width: 80,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});