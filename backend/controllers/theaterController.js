const Theater = require('../models/Theater');
const Screen = require('../models/Screen');
const Seat = require('../models/Seat');

// @desc    Get all theaters
// @route   GET /api/theaters
// @access  Public
const getTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find({}).populate('screens', 'name type capacity');
        res.json(theaters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a theater
// @route   POST /api/theaters
// @access  Private/Admin
const createTheater = async (req, res) => {
    const { name, location } = req.body;

    try {
        const theater = new Theater({
            name,
            location,
        });

        const createdTheater = await theater.save();
        res.status(201).json(createdTheater);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Add screen to theater
// @route   POST /api/theaters/:id/screens
// @access  Private/Admin
const addScreen = async (req, res) => {
    const { name, type, capacity, seatLayout } = req.body;
    const theaterId = req.params.id;

    try {
        const theater = await Theater.findById(theaterId);
        if (!theater) {
            return res.status(404).json({ message: 'Theater not found' });
        }

        const screen = new Screen({
            theater: theaterId,
            name,
            type,
            capacity,
            seatLayout,
        });

        const createdScreen = await screen.save();

        // Materialize Seats collection for this screen (static layout)
        const seatDocs = [];
        (seatLayout || []).forEach((row) => {
            (row.seats || []).forEach((seat) => {
                seatDocs.push({
                    screen: createdScreen._id,
                    theater: theaterId,
                    row: row.row,
                    number: seat.number,
                    type: seat.type,
                    priceModifier: seat.priceModifier || 0,
                    isAvailable: seat.isAvailable !== false,
                });
            });
        });
        if (seatDocs.length > 0) {
            await Seat.insertMany(seatDocs, { ordered: false });
        }

        // Add screen to theater's screens array
        theater.screens.push(createdScreen._id);
        await theater.save();

        res.status(201).json(createdScreen);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get screens for a theater
// @route   GET /api/theaters/:id/screens
// @access  Public
const getScreens = async (req, res) => {
    try {
        const screens = await Screen.find({ theater: req.params.id });
        res.json(screens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTheaters,
    createTheater,
    addScreen,
    getScreens,
};
