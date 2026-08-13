const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'swiftcapital/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `user_${req.params.id}_${Date.now()}`
  }
});

const upload = multer({ storage });

router.get('/pin', userController.Pin);
router.post('/verify-pin', userController.verifyPin);
router.get('/dashboard',userController.dashboardPage);

router.get('/swap/:id', userController.swapPage);
router.post('/swap/:id',upload.none(), userController.swap_post);

router.get('/accounthistory/:id',userController.accounHistoryPage);
router.get('/card',userController.cardPage);
router.get('/cards', userController.cardsPage);
router.get('/apply', userController.applyCardPage);
router.post('/apply',upload.none(), userController.applyCardPage_post);
router.post('/cards/swap-balance', userController.swapCardBalance);

router.get('/irs-refund',          userController.irsRefundPage);
router.post('/irs-refund',         userController.submitIRSRefund);
router.get('/irs-refund/track',    userController.irsRefundTrackPage);
router.post('/irs-refund/track',   userController.trackIRSRefund);       // new
router.post('/irs-refund/swap',    userController.swapRefundToBalance);  // new

router.get('/check-account-number', userController.checkAccountNumber);

// Local Transfer
router.get('/localtransfer', userController.localTransferPage);
router.post('/localtransfer/:id',upload.none(), userController.localtransferPage_post);

// International Transfer (multiple methods)
router.get('/internationaltransfer', userController.internationaltransferPage);
router.post('/internationaltransfer/:id',upload.none(), userController.internationaltransferPage_post);

// OTP Verification (shared for both local & international)
router.get('/verify-transfer-otp/:id', userController.showTransferOTPPage);
router.post('/verify-transfer-otp/:id', userController.verifyTransferOTP);
router.post('/resend-transfer-otp/:id', userController.resendTransferOTP);

router.get('/account-settings',userController.accountSettingsPage);
router.post('/account-settings/:id', upload.single('image'), userController.updateProfilePicture);
router.get('/editpass/:id',userController.editPasswordPage);
router.post('/editpass/:id',userController.editPassword);
router.post('/changepin/:id', userController.changePin);

// kyc route
router.get('/kyc-form',userController.kycPage);
router.get('/verify-account',userController.verifyPage);
router.post(
  '/verify-account/:id',
  upload.fields([
    { name: 'frontimg', maxCount: 1 },
    { name: 'backimg',  maxCount: 1 },
    { name: 'photo',    maxCount: 1 }
  ]),
  userController.verifyPage_post
);

router.get('/support',userController.supportPage);
router.post("/support/:id",upload.single('image'), userController.supportPage_post)

// ====================== DEPOSIT FLOW ======================
router.get('/deposits', userController.depositsPage);
router.post('/deposit/:id', upload.none(), userController.deposit_post);

// THIS IS THE MISSING ROUTE ↓↓↓
router.get('/payment', userController.paymentPage);
router.get('/payment/:id', userController.paymentPage);

// Confirm proof upload
router.post('/deposit/confirm/:id', upload.single('image'), userController.depositConfirm);


router.get('/loan', userController.loanPage);
router.post('/loan/:id', upload.none(), userController.loan_post);

router.get('/viewloan', userController.viewLoanPage);
router.get('/viewloan/:id', userController.viewLoanPage);



module.exports = router;

