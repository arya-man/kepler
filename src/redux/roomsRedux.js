import { PURGE } from "redux-persist"

export const GET_ROOMS = 'GET_ROOMS'

export const CHANGE_ADMIN = 'CHANGE_ADMIN'

export const GET_ROOM_HOSTS = 'GET_ROOM_HOSTS'
export const ADD_ROOM_HOSTS = 'ADD_ROOM_HOSTS'
export const REMOVE_ROOM_HOSTS = 'REMOVE_ROOM_HOSTS'
export const TALK_ROOM_HOSTS = 'TALK_ROOM_HOSTS'
export const CONNECTED_HOSTS = 'CONNECTED_HOSTS'
export const UPDATE_HOSTS = 'UPDATE_HOSTS'

export const GET_ROOM_AUDIENCE = 'GET_ROOM_AUDIENCE'
export const ADD_ROOM_AUDIENCE = 'ADD_ROOM_AUDIENCE'
export const REMOVE_ROOM_AUDIENCE = 'REMOVE_ROOM_AUDIENCE'
export const CONNECTED_AUDIENCE = 'CONNECTED_AUDIENCE'

export const GET_ROOM_QUEUE = 'GET_ROOM_QUEUE'
export const ADD_ROOM_QUEUE = 'ADD_ROOM_QUEUE'
export const REMOVE_ROOM_QUEUE = 'REMOVE_ROOM_QUEUE'
export const CONNECTED_QUEUE = 'CONNECTED_QUEUE'

export const GET_CONNECTED = 'GET_CONNECTED'

export const FLUSH_ROOM = 'FLUSH_ROOM'

export const ADD_AGORA_HOSTS = 'ADD_AGORA_HOSTS'
export const REMOVE_AGORA_HOSTS = 'REMOVE_AGORA_HOSTS'
export const AM_I_TALKING = 'AM_I_TALKING'
export const DEEP_LINK = 'DEEP_LINK'

const INITIAL_STATE = { roomAudience: [], roomHosts: [], roomQueue: [], rooms: [], connected: false , agoraHosts: {} , AmItalking: 0, deepLinkID:0}

export default function roomsRedux(state = INITIAL_STATE, action) {
    switch (action.type) {

        case DEEP_LINK:
            return {...state , deepLinkID: action.payload}
        
        case AM_I_TALKING:
            return {...state , AmItalking: action.payload}

        case ADD_AGORA_HOSTS:
            return {...state , agoraHosts: {[action.payload.agoraId]: action.payload.username , ...state.agoraHosts}}

        case REMOVE_AGORA_HOSTS:
            const {[action.payload.agoraId]: removedValue , ...leftOver} = state.agoraHosts
            return {...state , agoraHosts: leftOver}

        case FLUSH_ROOM:
            return { ...state, roomAudience: [], roomHosts: [], roomQueue: [], agoraHosts: {} , AmItalking: 0}

        case GET_CONNECTED:
            return { ...state, connected: action.payload }

        case GET_ROOMS:
            return { ...state, rooms: action.payload }

        case GET_ROOM_HOSTS:
            return { ...state, roomHosts: action.payload }

        case ADD_ROOM_HOSTS:
            return { ...state, roomHosts: [...state.roomHosts, action.payload] }

        case UPDATE_HOSTS:
            return {
                ...state, roomHosts: [...state.roomHosts.map((item) => {
                    if (item.username !== action.payload.username) {
                        return item
                    }
                    else {
                        return {
                            ...item,
                            value: action.payload.value
                        }
                    }
                })]
            }

        case REMOVE_ROOM_HOSTS:
            return {...state , roomHosts: [...state.roomHosts.filter(item => item.username !== action.payload)]}

        case TALK_ROOM_HOSTS:
            return {
                ...state, roomHosts: state.roomHosts.map((item) => {
                    for (var i = 0; i < action.payload.length; i += 1) {
                        if (item.username === action.payload[i]) {
                            return {
                                ...item,
                                talk: true
                            }
                        }
                        else {
                            return item
                        }
                    }
                })
            }

        case CONNECTED_HOSTS:
            return {
                ...state, roomHosts: state.roomHosts.map((item, index) => {
                    if (index === action.payload['index']) {
                        return {
                            ...item,
                            connected: action.payload['type']
                        }
                    }
                    else {
                        return item
                    }
                })
            }

        case GET_ROOM_AUDIENCE:
            return { ...state, roomAudience: action.payload }

        case ADD_ROOM_AUDIENCE:
            return { ...state, roomAudience: [...state.roomAudience, action.payload] }

        case REMOVE_ROOM_AUDIENCE:
            return {...state , roomAudience: [...state.roomAudience.filter(item => item.username !== action.payload)]}

        case CONNECTED_AUDIENCE:
            return {
                ...state, roomAudience: state.roomAudience.map((item, index) => {
                    if (index === action.payload['index']) {
                        return {
                            ...item,
                            connected: action.payload['type']
                        }
                    }
                    else {
                        return item
                    }
                })
            }


        case GET_ROOM_QUEUE:
            return { ...state, roomQueue: action.payload }

        case ADD_ROOM_QUEUE:
            return { ...state, roomQueue: [...state.roomQueue, action.payload] }

        case REMOVE_ROOM_QUEUE:
            return {...state , roomQueue: [...state.roomQueue.filter(item => item.username !== action.payload)]}

        case CONNECTED_QUEUE:
            return {
                ...state, roomQueue: state.roomQueue.map((item, index) => {
                    if (index === action.payload['index']) {
                        return {
                            ...item,
                            connected: action.payload['type']
                        }
                    }
                    else {
                        return item
                    }
                })
            }

        case CHANGE_ADMIN:
            return {
                ...state, roomHosts: state.roomHosts.map((item, index) => {
                    if (index === 0) {
                        return {
                            ...item, ...action.payload
                        }
                    }
                    else {
                        return item
                    }
                })
            }

        case PURGE:
            return INITIAL_STATE

        default:
            return state
    }
}