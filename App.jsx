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
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import AntDesign from 'react-native-vector-icons/AntDesign';

const App = () => {
  const camera = useRef(null);
  const [switchCameraValue, setSwitchCameraValue] = useState('front');
  const [flash, setFlash] = useState('off');
  const [showBorder, setShowBorder] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const device = useCameraDevice(switchCameraValue);
  const format = useCameraFormat(device, [{photoHdr: true}, {videoHdr: true}]);
  const supportsFlash = device?.hasFlash ?? false;
  const [showVideoIcon, setShowVideoIcon] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showCancelIcon, setShowCancelIcon] = useState(false);
  const [showResumeIcon, setShowResumeIcon] = useState(false);
  const [recordingStartedSuccess, setShowRecordingStartedSuccess] =
    useState(false);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    async function getPermission() {
      // Camera permission
      const cameraPermission = await Camera.requestCameraPermission();
      console.log(`Camera permission status: ${cameraPermission}`);
      if (cameraPermission === 'denied') await Linking.openSettings();

      // Request photo library permission for iOS
      if (Platform.OS === 'ios') {
        const photoLibraryPermission =
          await Camera.requestPhotoLibraryPermission();
        console.log(
          `Photo library permission status: ${photoLibraryPermission}`,
        );
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
        const photoPath =
          Platform.OS === 'ios'
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

  // Start Recording Video
  const videoRecord = () => {
    console.log('Video Recording Started.....');
    setShowPauseIcon(true);
    setShowCancelIcon(true);
    setShowRecordingStartedSuccess(true);
    startCounter();
    camera.current.startRecording({
      onRecordingFinished: video => {
        const path = video.path;
        CameraRoll.save(`file://${path}`, {
          type: 'video',
        });
      },
      onRecordingError: error => console.error(error),
    });
  };

  const stopRecording = () => {
    camera.current.stopRecording();
    setShowPauseIcon(false);
    setShowCancelIcon(false);
    setShowResumeIcon(false);
    setShowRecordingStartedSuccess(!recordingStartedSuccess);
    resetCounter();
  };

  const pauseRecording = () => {
    setShowResumeIcon(!showResumeIcon);
    camera.current.pauseRecording();
    stopCounter();
  };
  const resumeRecording = () => {
    setShowResumeIcon(!showResumeIcon);
    camera.current.resumeRecording();
    startCounter();
  };

  const startCounter = () => {
    const id = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);
    setIntervalId(id);
  };

  const stopCounter = () => {
    clearInterval(intervalId);
    setIntervalId(null);
  };

  const resetCounter = () => {
    setTimer(0);
    stopCounter();
  };

  const formatTime = timer => {
    const getSeconds = `0${timer % 60}`.slice(-2);
    const minutes = `${Math.floor(timer / 60)}`;
    const getMinutes = `0${minutes % 60}`.slice(-2);
    const getHours = `0${Math.floor(timer / 3600)}`.slice(-2);

    return `${getHours}:${getMinutes}:${getSeconds}`;
  };

  return (
    <View style={[styles.main, {borderWidth: showBorder ? 5 : 0}]}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        video={true}
        videoStabilizationMode="cinematic"
        videoHdr={format.supportsVideoHdr}
        photoHdr={format.supportsPhotoHdr}
        flash={supportsFlash ? flash : 'off'}
        photoQualityBalance="quality"
      />
      {saveError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      {showVideoIcon === false ? (
        <TouchableOpacity style={styles.touchButton} onPress={capturePhoto}>
          <Entypo name="camera" size={40} color={'white'} />
        </TouchableOpacity>
      ) : (
        <View style={styles.recordingButtonDesign}>
          {showVideoIcon && showPauseIcon && (
            <TouchableOpacity
              style={[styles.recordButton, {width: 60, height: 60}]}
              onPress={showResumeIcon ? resumeRecording : pauseRecording}>
              <AntDesign
                name={showResumeIcon ? 'play' : 'pause'}
                size={40}
                color={'white'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.recordButton}
            onPress={recordingStartedSuccess ? null : videoRecord}>
            <Entypo name="video-camera" size={40} color={'white'} />
          </TouchableOpacity>
          {showVideoIcon && showCancelIcon && (
            <TouchableOpacity
              style={[styles.recordButton, {width: 60, height: 60}]}
              onPress={stopRecording}>
              <Entypo name="controller-stop" size={40} color={'white'} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {showVideoIcon && (
        <View style={styles.timerView}>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>
      )}
      <View style={styles.iconHolder}>
        <TouchableOpacity
          style={styles.icon}
          onPress={() =>
            setSwitchCameraValue(prev => (prev === 'back' ? 'front' : 'back'))
          }>
          <Ionicons name="camera-reverse-outline" size={40} color={'white'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setShowVideoIcon(!showVideoIcon)}>
          <Entypo
            name={!showVideoIcon ? 'video-camera' : 'camera'}
            size={40}
            color={'white'}
          />
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
  recordingButtonDesign: {
    width: '80%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    position: 'absolute',
    bottom: 50,
  },
  recordButton: {
    width: 80,
    backgroundColor: 'red',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerView: {
    borderWidth: 2,
    width: 100,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'green',
    borderColor: 'green',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});
