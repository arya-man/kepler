import React, { Component } from 'react'
import { Image } from 'react-native'
import auth from '@react-native-firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

var unsubscribe
export default class Loading extends Component {

    componentDidMount() {
        unsubscribe = auth().onAuthStateChanged(async user => {
            if (user === null) {
                this.props.navigation.navigate('auth')
            }
            else {

                var bioDone = await AsyncStorage.getItem('bioDone')
                console.log("BIODONE", bioDone)
                if(bioDone === 'done') {
                    this.props.navigation.navigate('openingScreen')
                }
                else {
                    var data = await AsyncStorage.getItem('data')
                    console.log("DATA", data)
                    data = await JSON.parse(data)
                    if(data === null){
                        this.props.navigation.navigate('auth');
                    }
                    else{
                        this.props.navigation.navigate('addBio', data)
                    }
                }
            }
        })
    }

    componentWillUnmount() {
        unsubscribe()
    }

    render() {
        return (
            <Image source={require('../../Assets/launch_screen.png')} />
        )
    }

}