import Room from '../models/Room.js'
import Review from '../models/Review.js'
import User from '../models/User.js'

//[GET] /api/rooms/
export const roomMenu = (req, res, next) => {
    Room.find().sort({ratingCount: -1, ratingPoint: -1})
                .limit(24)
                .select('-creator -description -contact -remainCount')
                .then(rooms => res.status(200).json(rooms))
                .catch(next)
}

//[GET] /api/rooms/:id
export const getRoom = (req, res, next) => {
    const roomId = req.params.id
    Promise.all([Room.findById(roomId).populate('creator'),
                Review.find({ room: roomId }).populate('creator').sort('-createdAt')])
                .then(([rooms, reviews])=> res.status(200).json({rooms, reviews}))
                .catch(next)
}

//[GET] /api/rooms/find
export const findRooms = (req, res, next) => {
    const {lowerPrice, higherPrice, province, area} = req.query
    let q = {
        $and: []
    }
    if (province){
        q.$and.push({province})
    }
    if(area){
        q.$and.push({area})
    }
    if(lowerPrice){
        if(higherPrice){
            q.$and.push({price: {$gt: lowerPrice, $lt: higherPrice}})
        }
        else{
            q.$and.push({ price: {$gt: lowerPrice} })
        }
    }
    Room.find(q).then(rooms => res.status(200).json(rooms))
                .catch(next)
}

export const createRoom = (req, res, next) => {
    const userId = req.user._id
    const {title, area, description, price, remainCount, address, province, district, ward, contact, image} = req.body
    Room.create({
        title, creator: userId, area, description, price, remainCount, address, province, district, ward, contact, image
    })
    .then(room => res.status(201).json(room))
    .catch(next)
}

export const deleteRoom = (req, res) => {
    res.send('delete room')
}


//[GET] /api/rooms/favourites/:id
export const getAllFavouriteRooms = (req, res, next) => {
    const userId = req.params.id
    User.findById(userId)
        .populate('favourites')
        .then(user => res.status(200).json(user.favourites))
        .catch(next)
}

//[PUT] /api/rooms/favourites/add
export const addRoomToFavoriteList = async (req, res, next) => {
    const user = req.user
    const {roomId} = req.body
    let message, query
    // console.log(roomId, user.favourites)
    if (user.favourites.includes(roomId)){
        query = {
            $pull: {favourites: roomId}
        }
        message = 'Hủy yêu thích thành công'
    }
    else {
        query = {
            $push: { favourites: roomId }
        }
        message = 'Đã thêm vào danh sách yêu thích'
    }
    User.findByIdAndUpdate(user._id,
         query, 
         {new: true}
        )
        .populate('favourites')
        .then(u => res.status(200).json({
            favourites: u.favourites,
            message
        }))
        .catch(next)
}

//[PUT] /api/rooms/favourites/clear
export const clearFavouriteList = (req, res, next) => {
    const user = req.user
    if (!user.favourites.length){
        next(new Error('Danh sách rỗng !'))
    }

    User.findByIdAndUpdate(user._id, {
        favourites: []
    },
    {
        new: true
    })
    .then(u => res.status(200).json({favourites: u.favourites, message: 'Xóa thành công'}))
    .catch(next)
}
