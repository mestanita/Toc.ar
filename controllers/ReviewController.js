const Ticket = require('../models/Ticket');
const Review = require('../models/Review');

exports.submitReview = async (req, res) => {
  const { ticketCode, rating, comment, reviewerName } = req.body;

  try {
    const ticket = await Ticket.findOne({ qrCode: ticketCode }).populate('eventId');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Código de entrada no encontrado.' });
    }

    // REGLA DE NEGOCIO: Validar check-in realizado
    if (!ticket.checkedIn) {
      return res.status(403).json({ 
        success: false, 
        message: 'No asististe al evento o no se escaneó tu código de ingreso.' 
      });
    }

    const newReview = new Review({
      artistId: ticket.eventId.artistId,
      eventId: ticket.eventId._id,
      reviewerName,
      rating,
      comment
    });

    await newReview.save();
    res.status(200).json({ success: true, message: '¡Muchas gracias por calificar!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al procesar tu opinión.' });
  }
};