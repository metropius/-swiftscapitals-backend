const express = require("express");

const router = express.Router();

const { homePage, registerPage, loginPage, register_post,verifyEmail, login_post, loginAdmin, logout_get, securityPage, termsPage, licensesPage, aboutPage, alertsPage, faqPage, privacyPage, contactPage, verifyEmailPage, personalPage, outcardPage, appPage, loanPages, businessPage, forgetPasswordPage, forgetPasswordPage_post, resetPasswordPage_post, resetPasswordPage } = require("../controllers/userController");
const { loginAdmin_post } = require("../controllers/adminController");

router.get("/", homePage);
router.get("/about", aboutPage);
router.get("/business", businessPage);
router.get("/personal", personalPage);
router.get("/card", outcardPage);
router.get("/apps", appPage);
router.get("/loans", loanPages);
router.get("/contact", contactPage);
router.get("/converter", securityPage);
router.get("/terms-of-service", termsPage);
router.get("/chart", licensesPage);
router.get("/alerts", alertsPage);

router.get("/faq", faqPage);
router.get("/privacy-policy", privacyPage);

router.get("/register", registerPage);
router.post('/register',register_post);

router.get('/verify-email', (req, res, next) => {
  if (!req.query.user || !req.query.ver_code) {
    return verifyEmailPage(req, res);
  }
  next();
});

router.get('/verify-email', verifyEmail);

router.get("/login", loginPage);
router.post('/login',login_post)

router.get("/forgot-password", forgetPasswordPage);
router.post("/forgot-password", forgetPasswordPage_post);

router.get("/reset-password/:token", resetPasswordPage);
router.post("/reset-password/:token", resetPasswordPage_post);


// router.get('/loginAdminse', loginAdmin);
// router.post('/loginAdminse', loginAdmin_post)

router.get('/logout', logout_get)



module.exports = router;
