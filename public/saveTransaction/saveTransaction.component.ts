import { ChangeDetectorRef, Component, ErrorHandler, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { UserData } from 'src/app/Services/data.model';
import { UtilsService } from 'src/app/Services/utils.service';
import { AdmissionApiService } from 'src/app/Services/admission.service';
import * as $ from "jquery";
import { OtherApiService } from 'src/app/Services/other.service';
import { interval, merge, of, Subject, Subscription } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
declare var Razorpay: any;
declare var window: any;
declare var EasebuzzCheckout: any;
declare var $: any;          // jQuery
declare var pnCheckout: any; // Worldline pnCheckout function
declare var Cashfree: any;
@Component({
  selector: 'app-saveTransaction',
  templateUrl: './saveTransaction.component.html',
  styleUrls: ['./saveTransaction.component.scss']
})
export class SaveTransactionComponent implements OnInit, OnDestroy {
  entityId = localStorage.getItem('entityId');
  session = localStorage.getItem('session');
  mobile = localStorage.getItem('mobile');
  userName = localStorage.getItem('name')
  permissions = localStorage.getItem('permissions');
  entityName = localStorage.getItem('entityName');
  entityPreferences = JSON.parse(localStorage.getItem('entityPreferences'));
  displayNames: any = {};
  validationForm: FormGroup;
  hasFormErrors: boolean;
  studentData: any = [];
  paymentDetails: UserData = new UserData();
  // paymentModes = [ 'Cash', 'Cheque', 'Demand Draft', 'Bank Transfer', 'Card/POS', 'Online','Static UPI QR']
  paymentModes = []
  fields: any = [];
  myDate: Date = new Date();
  totalPaybleAmount: any;
  selectedStage: any;
  disableBackDateAdmission: boolean = false;
  viewLoading: boolean;
  cheque: boolean;
  cash: boolean;
  demamdDraft: boolean;
  receiptSessionDependency: boolean;
  separateAdmissionReceipt: boolean;
  receipt: any = [];
  autoVoucher: boolean;
  bankAccountList: any;
  odPayEntityId: any;
  hideAtOnline: boolean;
  studentEmail: any;
  studentName: any;
  studentPhone: any;
  studentToken: any;
  studentId: any;
  config: {};
  searchStudentData: any;
  disableDueToError: boolean;
  displayChargesCategory: boolean;
  minAmount: number;
  showResetbutton: boolean;
  selectedGatewayMode: any;
  selectedPaymentType: any;
  total: any;
  showFinalData: boolean = true;
  fineAmountWithCharges: any = {};
  messageTrue: boolean;
  allPaymentModes: any[];
  selectedModeType: string;
  totalPaidAmount: any;
  logo: any;
  paidAmount: any;
  receiptNo: any;
  id: any;
  allPaytmModes: any;
  disableDownload: boolean;
  images: any = ['../../../../../../../assets/images/payTM.png', '../../../../../../../assets/images/UPI_logo.png', '../../../../../../../assets/images/phonePay.png', '../../../../../../../assets/images/google-pay-gpay-logo.png']
  allEaseBuzzPaymentModes: any = [];
  primaryColour: any;
  allccAvenuePaymentModes: any = [];
  allEazyPayPaymentModes: any = []
  allEdvironPaymentModes: any = []
  allWorldLineModes: any[];
  odlogo = localStorage.getItem('logo')
  allCashfreeModes: any[];
  showPaymentLoadingPopup: boolean = false;
  allEazyPayPOSPaymentModes: any = []
  private posStatusSubscription: Subscription;
  confirmPaidProcees: boolean;
  posStatus: any;
  paymentDevices: any;
  validationPaymentDevice: FormGroup
  seletedPaymentDevice: any;
  dataOfEaszyPayPOS: any;
  private stop$ = new Subject<void>();
  private manual$ = new Subject<void>();
  pollingStarted = false;
  initiatePaymentData: any;
  constructor(public dialogRef: MatDialogRef<SaveTransactionComponent>,
    private service: AdmissionApiService, private util: UtilsService, private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any, private ref: ChangeDetectorRef, private fb: FormBuilder, private dialog: MatDialog, private otherService: OtherApiService) { }

  roundUpToTwoDecimals(amount: number): number {
    if (amount == null || amount == undefined || isNaN(amount)) return 0;
    // Check if number has decimals
    if (amount % 1 !== 0) {
      // Has decimals, round up to 2 decimal places
      return Number((Math.ceil(amount * 100) / 100).toFixed(2));
    }
    // No decimals, return as is
    return amount;
  }

  ngOnInit() {
    this.displayNames = {
      regNo: this.entityPreferences.displayNames.filter(item => item.value == 'regNo')[0] ? this.entityPreferences.displayNames.filter(item => item.value == 'regNo')[0].name : 'Registration No',
      course: this.entityPreferences.displayNames.filter(item => item.value == 'course')[0] ? this.entityPreferences.displayNames.filter(item => item.value == 'course')[0].name : 'Class',
      instituteBank: this.entityPreferences.displayNames.filter(item => item.value == 'instituteBank')[0] ? this.entityPreferences.displayNames.filter(item => item.value == 'instituteBank')[0].name : 'Institute Bank',
      batch: this.entityPreferences.showBatch,
      stream: this.entityPreferences.displayNames.filter(item => item.value == 'stream')[0] ? this.entityPreferences.displayNames.filter(item => item.value == 'stream')[0].name : 'Stream',

    };
    this.primaryColour = this.otherService.passColour()
    this.autoVoucher = this.entityPreferences.autoVoucher
    this.paymentDevices = this.entityPreferences && this.entityPreferences.paymentDevices ? this.entityPreferences.paymentDevices : []
    if (this.entityPreferences) {
      this.disableBackDateAdmission = this.entityPreferences.disableBackDateAdmission;
      this.receiptSessionDependency = this.entityPreferences.receiptSessionDependency;
      this.separateAdmissionReceipt = this.entityPreferences.separateAdmissionReceipt;
    }
    this.studentData = this.data.studentData;
    this.totalPaybleAmount = this.roundUpToTwoDecimals(this.data.totalPaybleAmount);
    this.totalPaidAmount = this.roundUpToTwoDecimals(this.data.totalPaidAmount);
    this.selectedStage = this.data.selectedStage.currentStage;
    this.receipt = this.data.receipt;
    this.paymentDetails.paymentMode = 'Cash'
    // this.viewAdmissionMaster();
    this.validatePaymentForm();
    this.viewFeeMaster();
    this.paymentDetails.date = new Date()
  }
  validatePaymentForm() {
    this.validationForm = this.fb.group({
      controlPaymentMode: ['', Validators.compose([
        Validators.required,
      ]),
      ],
      controlBank: ['', Validators.compose([
        // Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern("[a-zA-Z0-9 \'\-\.]+$")
      ]),
      ],
      controlRfid: ['', Validators.compose([
        // Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern("[a-zA-Z0-9 \'\-\.]+$")
      ]),
      ],
      controlRemark: ['', Validators.compose([
        // Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern("[a-zA-Z0-9 \'\-\.]+$")
      ]),
      ],
      // controlDate: ['', Validators.compose([
      //   Validators.required,
      //   // Validators.minLength(2),
      //   // Validators.maxLength(100),
      //   // Validators.pattern("[a-zA-Z0-9 \'\-\.]+$")
      // ]),
      // ],
    });
    this.validationPaymentDevice = this.fb.group({
      controlPayment: ['', Validators.compose([
        Validators.required,
        // Validators.minLength(2),
        // Validators.maxLength(100),
        // Validators.pattern("[a-zA-Z0-9 \'\-\.]+$")
      ]),
      ],

    })
  }
  viewAdmissionMaster() {
    this.service.viewAdmissionMaster(this.entityId, this.studentData.session)
    .subscribe(res=>{
      if(!res.txnReceipt){
        this.util.alertNotificationMessage('Please add Transaction receipt settings for the session : ' + this.studentData.session);
        this.dialogRef.close({ isEdit: false })
        let txnReceipt = res.txnReceipt;
      }
      this.ref.detectChanges();
    },
    err=>{
      this.util.errmsg(err);
    })
  }
  foo(data) {
    this.dialogRef.close({ data, isEdit: false })
  }
  trackByIndex(index: number, obj: any): any {
    return index;
  }
  selectPaymentMode(mode, event: any) {
    if (event.isUserInput) {
      this.paymentDetails.bankAccount = "";
      if (mode == "Cheque") {
        this.cheque = true;
        this.cash = false;
        this.demamdDraft = false;
      }
      if (mode != "Cheque" && mode != "Demand Draft") {
        this.cheque = false;
        this.cash = true;
        this.demamdDraft = false;
      }
      if (mode == "Demand Draft") {
        this.cheque = false;
        this.cash = false;
        this.demamdDraft = true;
      }
      if (mode == 'Cash') {
        this.paymentDetails.bankAccount = 'Cash';
      }

    }
  }
  viewFeeMaster() {
    this.service.viewFeeMasterData(this.entityId, this.session)
      .subscribe(res => {
        this.bankAccountList = res.bankAccount;
        this.paymentModes = res.paymentMode;
        this.paymentDetails.paymentMode = res.defaultPaymentMode;
      }, err => {

      })
  }
  onSubmit(data) {
    if (this.paymentDetails && !this.paymentDetails.paymentMode) {
      this.util.alertNotificationMessage("Payment mode setting not found. Please enable it before proceeding. ");
      return
    }
    this.viewLoading = true;
    this.hasFormErrors = false;
    const controls = this.validationForm.controls;
    /** check form */
    if (this.validationForm.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      this.hasFormErrors = true;
      this.viewLoading = false;
      return;
    }
    for (let item of this.receipt) {
      if (item.paidAmount == null || item.paidAmount == "") {
        item.paidAmount = 0;
      } else {
        item.paidAmount = this.roundUpToTwoDecimals(item.paidAmount);
      }
    }
    let formData = {
      studentData: this.studentData._id,
      applicationNumber: this.studentData.applicationNumber,
      receiptSessionDependency: this.receiptSessionDependency,
      separateAdmissionReceipt: this.separateAdmissionReceipt,
      applicationDetails: {
        course: this.studentData.course,
        stream: this.studentData.stream,
        stage: this.selectedStage
      },
      totalPaybleAmount: this.totalPaybleAmount,
      totalPaidAmount: this.totalPaybleAmount,
      receipt: this.receipt,
      date: this.myDate,
      paymentDetails: {
        paymentMode: this.paymentDetails.paymentMode,
        refId: this.paymentDetails.refId,
        date: this.paymentDetails.date,
        bankName: this.paymentDetails.bankName,
        bankAccount: this.paymentDetails.bankAccount
      },
      remark: this.paymentDetails.remark,
      entity: this.entityId,
      session: this.studentData.session,
      autoVoucher: this.autoVoucher
    }
    this.service.saveAdmissionTransaction(formData)
      .subscribe(res => {
        this.viewLoading = false;
        // this.util.alertMessage('Transaction', 'Saved');
        let id = res._id;
        this.router.navigate(['/print/open/printAdmissionTransaction/' + id, { prev: '/admission/studentData', prevName: 'Admission Application Data', course: this.studentData.course }]);
        // window.open(this.service.browserDomain+ '/print/open/printAdmissionTransaction/'+ id , id);
        this.dialogRef.close({ data, paymentDetails: res, isEdit: true })
      },
        err => {
          this.viewLoading = false;
          this.util.errmsg(err);
        })



  }

  confirmToPayOnline() {
    if (this.paymentDetails && !this.paymentDetails.paymentMode) {
      this.util.alertNotificationMessage("Payment mode setting not found. Please enable it before proceeding. ");
      return
    }
    //condition to be added of enitYId from localStorage
    this.service.getEntityId(this.studentData.entity,this.studentData.branchId)
    .subscribe(res=>{
      this.odPayEntityId = res._id;
      this.hideAtOnline = true
     if(!this.studentData.phone ){
        this.util.alertNotificationMessage("Please add Mobile Number first in the application")
        return;
     }
     if(this.studentData.phone.toString().length >10 || this.studentData.phone.toString().length<10){
      this.util.alertNotificationMessage("Please check mobile number length");
      return;
     }
     else{
       this.loginWithoutOTP();
       this.ref.detectChanges();
     }
    },err=>{
      this.util.errmsg(err);
    })

  }


  loginWithoutOTP() {
    this.service.loginWithoutOTP(this.studentData.phone)
      .subscribe(res => {
        this.studentEmail = res.email;
        this.studentName = res.name;
        this.studentPhone = res.phone;
        this.studentToken = res.token;
        this.studentId = res._id;
        localStorage.setItem('studentToken', res.token);
        this.getOdPayData();
      }, err => {
        this.util.errmsg(ErrorHandler)
      })
  }

  getOdPayData() {
    this.service.getDataFromODpay(this.odPayEntityId, this.studentData.applicationNumber, this.studentData.session)
      .subscribe(res => {
        this.searchStudentData = res.data[0];
        this.disableDueToError = false;
        this.displayChargesCategory = false;
        this.minAmount = this.roundUpToTwoDecimals((this.searchStudentData.amountDue * this.searchStudentData.entity.minAmt) / 100);
        this.proceedTopay()
        this.ref.detectChanges()
      }, err => {
        this.disableDueToError = true

        if (err.error.redirect) {
          if (this.checkPermission('resetODPayUserPassword')) {
            this.resetUserPassword();
            // document.getElementById('proceedButton').click();
          } else {
            this.util.alertNotificationMessage("Please give reset password Permission")
          }
        }
        else {
          this.util.alertNotificationMessage("Error from od Pay!! " + err.error.message);
          // document.getElementById('proceedButton').click();
          return;
        }
      })
  }



  resetUserPassword() {
    this.service.resetUserPasswordFromERP(this.studentId, undefined).
      subscribe(res => {
        this.showResetbutton = false;
        this.util.alertSpecialMessage('You can try again!!');
        this.ref.detectChanges();
      }, err => {
        this.util.errmsg(err);
      })
  }

  checkModeSelected(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;

      switch (value.paymentModeName) {
        case "card":
          this.config = {
            display: {
              blocks: {
                banks: {
                  name: 'Pay via Card',
                  instruments: [
                    {
                      method: 'card',
                      types: ['debit']
                    }]
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: false,
              },
            },
          }
          break;
        case "creditCard":
          this.config = {
            display: {
              blocks: {
                banks: {
                  name: 'Pay via Credit Card',
                  instruments: [
                    {
                      method: 'card',
                      types: ['credit']
                    }]
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: false,
              },
            },
          }
          break;
        case "wallet":
          this.config = {
            display: {
              blocks: {
                banks: {
                  name: 'Pay via wallet',
                  instruments: [
                    {
                      method: 'wallet',
                    }
                  ]
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: false,
              },
            },
          }
          break;
        case "upi":
          this.config = {
            display: {
              blocks: {
                banks: {
                  name: 'Pay via UPI',
                  instruments: [
                    {
                      method: 'upi',
                    }
                  ]
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: false,
              },
            },
          }
          break;
        case "netbanking":
          this.config = {
            display: {
              blocks: {
                banks: {
                  name: 'Pay via NetBanking',
                  instruments: [
                    {
                      method: 'netbanking',
                    }
                  ]
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: false,
              },
            },
          }

          break;
      }
      this.applyCharges();
    }
  }

  applyCharges() {
    let formData = {
      paymentGateway: this.selectedGatewayMode,
      paymentMode: this.selectedPaymentType.paymentModeName,
      entity: this.odPayEntityId,
      amount: this.totalPaybleAmount
    }

    this.service.applyCharges(formData)
      .subscribe(res => {
        // this.displayChargesCategory = true;
        this.showFinalData = false;
        this.fineAmountWithCharges = res.data
        if (this.fineAmountWithCharges.message) {
          this.messageTrue = true;
        } else {
          this.messageTrue = false;
        }
        this.ref.detectChanges();
      }, err => {
        this.util.errmsg(err)
        if (err.error.redirect) {
          this.showResetbutton = true
        }
      })
  }
  checkModeSelectedWorldline(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      this.applyCharges();
    }
  }
  checkModeSelectedEaseBuzz(event, value, item) {
    console.log(event, value, item)
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      this.applyCharges();
    }
  }
  checkModeSelectedccAvenue(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      this.applyCharges();
    }
  }
  checkModeSelectedEazyPay(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      this.applyCharges();
    }
  }
  checkModeSelectedEdviron(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      this.applyCharges();
    }
  }

  checkModeSelectedCashfree(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      this.applyCharges();
    }
  }
  checkModeSelectedPaytm(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      switch (value.paymentModeName) {
        case "UPI":
          this.config = {
            labels: {
              "UPI": "Bhim UPI"
            },
            filter: {
              "exclude": ['NB', 'DC', 'CARD', 'PDC', 'PPBL', 'BALANCE']
            },
            order: ['UPI']
          }
          break;

        case "NB":
          this.config = {
            labels: {
              "NetBanking": "Netbanking"
            },
            filter: {
              "exclude": ['UPI', 'DC', 'CARD', 'PDC', 'PPBL', 'BALANCE']
            },
            order: ['NB']
          }
          break;

        case "DC":
          this.config = {
            labels: {
              "DebitCard": "Debit Card"
            },
            filter: {
              "exclude": ['UPI', 'NB', 'PDC', 'PPBL', 'BALANCE']
            },
            order: ['DC']
          }
          break;
      }
      this.applyCharges();
    }
  }


  checkChargesCategory() {
    this.allPaymentModes = [];
    this.allPaytmModes = [];
    this.allEaseBuzzPaymentModes = []
    this.allccAvenuePaymentModes = []
    this.allEazyPayPaymentModes = []
    this.allEdvironPaymentModes = []
    this.allWorldLineModes = []
    this.allCashfreeModes = []
    this.allEazyPayPOSPaymentModes = []
    if (!this.searchStudentData.entity.chargesCategory && !this.searchStudentData.entity.paymentGateway) {
      this.util.alertNotificationMessage("Payment Gateway not assigned")
      return;
    } else if (!this.searchStudentData.entity.chargesCategory && this.searchStudentData.entity.paymentGateway) {
      switch (this.searchStudentData.entity.paymentGateway) {
        case "razorpay":
          this.payAmount() //inititate txn
          break;
        // case "paytm":
        //   this.payAmount()
        //   break;   
        case "easeBuzz":
          this.payAmount()
          break;
        case "ccAvenue":
          this.payAmount()
          break;
        case "eazyPay":
          this.payAmount()
          break;
        case "edviron":
          this.payAmount()
          break;
        case "worldline":
          this.payAmount()
          break
        case "cashfree":
          this.payAmount()
          break;
        case "eazypayPOS":
          this.payAmount();
          break;
        default:
          this.util.alertNotificationMessage("Invalid Payment Gateway assigned");
          break;
      }
    } else if (this.searchStudentData.entity.chargesCategory) {
      for (let item of this.searchStudentData.entity.chargesCategory.gateway) {
        if (item.gatewayName == "razorpay")
          this.allPaymentModes.push(item);

        if (item.gatewayName == "paytm") {
          this.allPaytmModes.push(item);
          let arr = this.allPaytmModes[0].paymentMode
          this.util.arrayReverseSort(arr, 'paymentModeName');

        }
        if (item.gatewayName == "easeBuzz")
          this.allEaseBuzzPaymentModes.push(item);
        if (item.gatewayName == "ccAvenue")
          this.allccAvenuePaymentModes.push(item);
        if (item.gatewayName == "eazyPay")
          this.allEazyPayPaymentModes.push(item);
        if (item.gatewayName == "edviron")
          this.allEdvironPaymentModes.push(item);
        if (item.gatewayName == 'worldline')
          this.allWorldLineModes.push(item)
        if (item.gatewayName == 'cashfree')
          this.allCashfreeModes.push(item)
        if (item.gatewayName == "eazypayPOS")
          this.allEazyPayPOSPaymentModes.push(item);
      }
      this.displayChargesCategory = false;
    }
    let razorpaycheck = false;
    let paytmcheck = false;
    let easeBuzz = false;
    let ccAvenue = false
    let eazyPay = false
    let edviron = false;
    let worldline = false
    let cashfree = false
    let eazypayPOS = false
    for (let item of this.allPaymentModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'upi') {
          razorpaycheck = true;
          break;
        }
      }
    }
    for (let item of this.allPaytmModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          paytmcheck = true;
          break;
        }
      }
    }
    for (let item of this.allEaseBuzzPaymentModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          easeBuzz = true;
          break;
        }
      }
    }
    for (let item of this.allccAvenuePaymentModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          ccAvenue = true;
          break;
        }
      }
    }
    for (let item of this.allEazyPayPaymentModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          eazyPay = true;
          break;
        }
      }
    }
    for (let item of this.allEdvironPaymentModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          edviron = true;
          break;
        }
      }
    }
    for (let item of this.allWorldLineModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          worldline = true;
          break;
        }
      }
    }
    for (let item of this.allCashfreeModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          cashfree = true;
          break;
        }
      }
    }
    for (let item of this.allEazyPayPOSPaymentModes) {
      for (let value of item.paymentMode) {
        if (value.paymentModeName == 'UPI') {
          eazypayPOS = true;
          break;
        }
      }
    }
    this.ref.detectChanges();
    if (razorpaycheck) {
      (<HTMLInputElement>document.getElementById('ratioButtonupi')).click()
    } else if (paytmcheck) {
      (<HTMLInputElement>document.getElementById('ratioButtonUPI')).click()
    } else if (easeBuzz) {
      (<HTMLInputElement>document.getElementById('ratioButtonEaseBuzz')).click()
    }
    else if (ccAvenue) {
      (<HTMLInputElement>document.getElementById('ratioButtonAvenue')).click()
    }
    else if (eazyPay) {
      (<HTMLInputElement>document.getElementById('ratioButtonEazyPay')).click()
    }
    else if (edviron) {
      (<HTMLInputElement>document.getElementById('ratioButtonEdvironPay')).click()
    }
    else if (worldline) {
      (<HTMLInputElement>document.getElementById('radioButtonWorldline')).click()
    }
    else if (eazypayPOS) {
      (<HTMLInputElement>document.getElementById('ratioButtonEazyPayPOS')).click()
    }
    else {
      (<HTMLInputElement>document.getElementById('ratioButton')).click()
    }
  }
  checkModeSelectedEazyPayPos(event, value, item) {
    if (event.target.value == 'on') {
      this.selectedGatewayMode = item.gatewayName;
      this.selectedPaymentType = value;
      this.applyCharges();
    }
  }
  proceedTopay() {
    let formData = {
      entity: this.odPayEntityId,
      enrollmentNumber: this.studentData.applicationNumber,
      installmentAmount: this.totalPaybleAmount,  //original           
      total: this.totalPaybleAmount,  //edited                        
      user: this.studentEmail,
      userMobile: this.studentPhone,
      userId: this.studentId
    }
    this.service.recentPaymentCheck(formData)
      .subscribe(res => {
        this.selectedModeType = 'upi'
        if (res.count == 0) {
          this.checkChargesCategory()
        } else {
          // let sure = confirm('If payment has been deducted from your bank account, please do not pay again');
          this.util.confirmAlert("If payment has been deducted from your bank account, please do not pay again").subscribe((sure: boolean) => {
            if (sure) {
              this.checkChargesCategory()
            } else {
              return
            }
          })
        }

      }, err => {
        if (err.error.redirect) {
          this.showResetbutton = true;
        }
      })
  }

  payAmount() {
    if (this.selectedGatewayMode == 'easeBuzzPOS' || this.selectedGatewayMode == 'eazypayPOS') {
      if (this.paymentDevices && this.paymentDevices.length == 1) {
        this.seletedPaymentDevice = this.paymentDevices[0].deviceId;
        this.callInitiate()
      } else {
        this.openDeviceIdDialog()
      }
    } else {
      this.payTheAmount()
    }
  }
  callInitiate() {
    if (this.paymentDevices && this.paymentDevices.length > 1) {
      const controls = this.validationPaymentDevice.controls;
      if (this.validationPaymentDevice.invalid) {
        Object.keys(controls).map(control => {
          controls[control].markAsTouched();
        })
        return;
      }
    }

    this.payTheAmount()
  }
  openDialogPOS(templateref) {
    this.dialog.open(templateref, { disableClose: true })
    this.manualCall()
    this.startLookingForStatus()
  }
  payWithPosPayment(res) {
    this.dataOfEaszyPayPOS = res;
    document.getElementById('getPosPayment').click()
  }
  openDeviceIdDialog() {

    document.getElementById('openDeviceId').click()
  }
  closePaymentVerification() {
    this.dialog.closeAll()
    if (this.pollingStarted) {
      this.stop$.next();
      if (this.posStatusSubscription) {
        this.posStatusSubscription.unsubscribe();
        this.posStatusSubscription = null;
      }
      this.pollingStarted = false;
    }
    this.ref.detectChanges();
  }
  startLookingForStatus() {
    if (this.pollingStarted) return;

    this.pollingStarted = true;
    this.posStatus = {
      orderId: this.dataOfEaszyPayPOS.communication && this.dataOfEaszyPayPOS.communication.receipt ? this.dataOfEaszyPayPOS.communication.receipt : '',
      gateway: this.dataOfEaszyPayPOS.paymentGateway ? this.dataOfEaszyPayPOS.paymentGateway : this.selectedGatewayMode
    };
    this.posStatusSubscription = merge(interval(10000), this.manual$)
      .pipe(
        takeUntil(this.stop$),
        switchMap(() => this.service.updateStatus(this.posStatus)
          .pipe(
            catchError(err => {
              console.error('API Error:', err);
              return of(null); // return null so polling continues
            })
          ))
      )
      .subscribe({
        next: res => {
          console.log('API Response:', res);
          if (res) {
            if (res.status == 'paid') {
              this.stop$.next();
              if (this.posStatusSubscription) {
                this.posStatusSubscription.unsubscribe();
                this.posStatusSubscription = null;
              }
              this.pollingStarted = false;
              // this.receiptNo=res.data.name;
              setTimeout(() => {
                this.viewByTxnId(res.name)
                this.dialog.closeAll()
                document.getElementById("thankuFilter").click();
                this.ref.detectChanges();

              }, 3000);

            }
          }
        },
        // error: err => {
        //   console.error('API Error:', err);
        //   // this.stop$.next();
        // }
      });
  }
  manualCall() {
    this.posStatus = {
      orderId: this.dataOfEaszyPayPOS.communication && this.dataOfEaszyPayPOS.communication.receipt ? this.dataOfEaszyPayPOS.communication.receipt : '',
      gateway: this.dataOfEaszyPayPOS.paymentGateway ? this.dataOfEaszyPayPOS.paymentGateway : this.selectedGatewayMode
    };
    this.service.updateStatus(this.posStatus).subscribe({
      next: res => {
        if (res.status == 'paid') {
          setTimeout(() => {
            // this.paidAmount=res.data.paidAmount
            this.receiptNo = res.receiptId;
            this.viewByTxnId(res.name)
            this.dialog.closeAll()
            document.getElementById('app-close-btn').click();
            document.getElementById("thankuFilter").click();

            if (this.pollingStarted) {
              this.stop$.next();
              if (this.posStatusSubscription) {
                this.posStatusSubscription.unsubscribe();
                this.posStatusSubscription = null;
              }
              this.pollingStarted = false;
            }
            this.ref.detectChanges();
          }, 4000);
          // this.viewByTxnId(res.name)
          // this.dialog.closeAll()

          this.ref.detectChanges();
        }

      },
      // error: err => console.error('Manual API Error:', err)
    });

    // If polling is active, notify the stream as well (optional)
    // if (this.pollingStarted) {
    //   this.manual$.next();
    // }
  }
  payTheAmount() {
    let finalArr = []
    let formData: any = {}
    if (this.totalPaybleAmount > 0 && this.studentData.session && this.receipt.length > 0) {
      formData = {
        entity: this.odPayEntityId,
        enrollmentNumber: this.studentData.applicationNumber,
        name: this.searchStudentData.name,
        meta: this.searchStudentData.meta,
        installmentAmount: this.totalPaybleAmount,
        totalAmount: this.totalPaybleAmount,
        amount: this.totalPaybleAmount,
        total: this.totalPaybleAmount,
        paymentGateway: this.selectedGatewayMode,
        paymentMode: this.selectedPaymentType.paymentModeName,
        user: this.studentEmail,
        userId: this.studentId,
        userMobile: this.studentPhone,
        requestMode: "erp",
        erpUserName: this.userName,
        erpUserMobile: this.mobile,
        erpReceiptArr: this.receipt,
        erpRemark: this.paymentDetails.remark,
        erpSession: this.studentData.session,
        erpTransactionType: "admission"
      }
    } else {
      this.util.alertNotificationMessage("Required fields not present, Please try again");
      return
    }

   if (this.selectedGatewayMode == 'easeBuzzPOS' || this.selectedGatewayMode == 'eazypayPOS') {
      formData.deviceId = this.seletedPaymentDevice ? this.seletedPaymentDevice : null
    }
    this.service.initiateTxn(formData)
      .subscribe(res => {
        if (this.selectedGatewayMode == 'razorpay')
          this.payWithRazor(res);

        if (this.selectedGatewayMode == 'paytm')
          this.payWithPaytm(res);
        if (this.selectedGatewayMode == 'easeBuzz')
          this.payWithEaseBuzz(res);
        if (this.selectedGatewayMode == 'ccAvenue')
          this.payWithCCAvenue(res);
        if (this.selectedGatewayMode == 'eazyPay')
          this.payWithEazyPay(res);
        if (this.selectedGatewayMode == 'edviron')
          this.payWithEdviron(res);
        if (this.selectedGatewayMode == 'worldline')
          this.payWithWorldLine(res);
        if (this.selectedGatewayMode == 'cashfree')
          this.payWithCashfree(res);
        if (this.selectedGatewayMode == 'eazypayPOS')
          this.payWithPosPayment(res);
      }, err => {
        if (err.error.redirect) {
          this.showResetbutton = true;
        }
        this.util.errmsg(err)
      })
  }
  public payWithRazor(res) {
    const options: any = {
      "key": res.key,
      "amount": res.amount,
      "currency": 'INR',
      "name": this.searchStudentData.name,
      "description": 'Transaction Type:Admission | for - ' + this.studentName + '-' + this.studentData.applicationNumber,
      "handler": function (response) {
        this.payRazorAmount(response)
      }.bind(this),
      "image": this.logo,
      "order_id": res.id,
      "modal": {

        escape: false,
      },
      "prefill": {
        name: this.studentName,
        email: this.studentEmail,
        contact: this.studentPhone,
        method: this.selectedPaymentType.paymentModeName
      },
      "config": this.config,
      "notes": {
        "address": "Razorpay Corporate Office"
      },
      "theme": {
        'color': this.primaryColour
      }
    };

    $.getScript('https://checkout.razorpay.com/v1/checkout.js', function () {
      var rzp1 = new Razorpay(options);
      rzp1.open();
      rzp1.on('payment.failed', function (response) {
        this.util.alertNotificationMessage(response.error.description);
      });
    });

  }
  public payWithPaytm(res) {


    let defaultMerchantConfiguration = {
      "root": "",
      "style": {
        "bodyColor": "",
        "themeBackgroundColor": "",
        "themeColor": "#F37254",
        "headerBackgroundColor": "",
        "headerColor": "",
        "errorColor": "",
        "successColor": ""
      },


      "flow": "DEFAULT",
      "data": {
        "orderId": res.paytmParams.orderId,
        "token": res.paytmParams.txnToken,
        "tokenType": "TXN_TOKEN",
        "amount": res.amount,
        "userDetail": {
          "mobileNumber": this.studentPhone,
          "name": this.studentName
        },

      },
      "merchant": {
        "mid": res.paytmParams.mid,
        "name": this.entityName,
        "redirect": false
      },
      "labels": "DEFAULT",
      "payMode": this.config,
      "handler": {
        "transactionStatus": function (paymentStatus) {
          paymentStatus.paymentGateway = "paytm"
          this.service.processPayment(paymentStatus).
            subscribe(res => {
              this.paidAmount = this.roundUpToTwoDecimals(res.data.paidAmount);
              this.receiptNo = res.data.name;
              this.ref.detectChanges();
              document.getElementById('app-close-btn').click();
              document.getElementById("thankuFilter").click();

              this.viewByTxnId(this.receiptNo);
            }, err => {
              document.getElementById('app-close-btn').click();
              document.getElementById("failedFilter").click();
              // this.util.alertNotificationMessage("Payment Failed !! Please try Again.")
              if (err.error.redirect) {
                this.showResetbutton = true
              }
            })
          // this.payPaytmAmount(data)
        }.bind(this),

        "notifyMerchant": function (eventName, data) {
          // this.payPaytmAmount(data)
        }.bind(this),
      }


    };

    $.getScript(`https://${res.paytmParams.host}/merchantpgpui/checkoutjs/merchants/${res.paytmParams.mid}.js`, function () {

      if (window.Paytm && window.Paytm.CheckoutJS) {
        window.Paytm.CheckoutJS.onLoad(function excecuteAfterCompleteLoad() {
          // initialze configuration using init method
          window.Paytm.CheckoutJS.init(defaultMerchantConfiguration).then(function onSuccess() {
            // after successfully updating configuration, invoke JS Checkout
            window.Paytm.CheckoutJS.invoke();
          }).catch(function onError(error) {
            console.log("error => ", error);
          });
        });
      }


    })
  }
  public payWithEaseBuzz(res) {

    const options = {
      "payment_mode": this.selectedPaymentType.paymentModeName,
      "upi_qr": "true",
      "access_key": res.accessKey,
      "request_mode": "",
      //     "handler": function (response){
      //       this.payEaseBuzzAmount(response)
      // }.bind(this)
      onResponse: (response) => {
        response.paymentGateway = "easeBuzz"
        this.service.processPayment(response).
          subscribe(res => {
            this.paidAmount = this.roundUpToTwoDecimals(res.data.paidAmount);
            this.receiptNo = res.data.name;
            this.ref.detectChanges();
            document.getElementById("thankuFilter").click();

            this.viewByTxnId(this.receiptNo);
          }, err => {
            document.getElementById("failedFilter").click();
            // alert("Payment Failed !! Please try Again.")
            if (err.error.redirect) {
              this.showResetbutton = true
            }
          })
      },
    }
    if (this.selectedPaymentType.paymentModeName == 'UPI') {
      options.request_mode = 'SUVA'
    }
    $.getScript('https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.0/easebuzz-checkout-v2.min.js', function () {
      var easebuzzCheckout = new EasebuzzCheckout(res.key, res.env);
      easebuzzCheckout.initiatePayment(options);
      easebuzzCheckout.on('payment.failed', function (response) {
        alert(response.error.description);
      });
    });
  }
  payWithCCAvenue(res) {
    const url = `${res.redirectUrl}&encRequest=${res.ccAvenueData.encryptedData}&access_code=${res.ccAvenueData.access_code}`;
    window.open(url, '_self')
  }
  payWithEazyPay(res) {
    const url = res.redirectUrl
    window.open(url, '_self')
  }
  payWithEdviron(res) {
    const url = res.redirectUrl
    window.open(url, '_self')
  }
  public payWithWorldLine(res: any) {
    console.log(this.selectedGatewayMode)
    // Step 1: Load Worldline checkout.js dynamically
    const scriptUrl = 'https://www.paynimo.com/paynimocheckout/server/lib/checkout.js';

    if (!document.getElementById('worldline-script')) {
      const script = document.createElement('script');
      script.id = 'worldline-script';
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }

    // Wait until jQuery and Worldline are loaded
    const waitForWorldline = setInterval(() => {
      if (window['$'] && typeof $.pnCheckout === 'function') {
        clearInterval(waitForWorldline);

        // Step 2: Create configuration object
        const reqJson: any = {
          features: {
            enableAbortResponse: true,
            enableExpressPay: true,
            enableInstrumentDeRegistration: true,
            enableMerTxnDetails: true
          },
          consumerData: {
            deviceId: "WEBSH2",
            merchantLogoUrl: this.odlogo,
            paymentMode: this.selectedPaymentType.paymentModeName,
            customStyle: {
              PRIMARY_COLOR_CODE: this.primaryColour
            },
            responseHandler: function (response: any) {
              this.payWorldlineAmount(response);
            }.bind(this),
            ...res.consumerData
          }
        };

        // Step 3: Execute checkout
        $.pnCheckout(reqJson);
      }
    }, 100);
  }
  payWorldlineAmount(response) {

    response.paymentGateway = "worldline"
    this.service.processPayment(response).
      subscribe(res => {
        this.paidAmount = this.roundUpToTwoDecimals(res.data.paidAmount);
        this.receiptNo = res.data.name;
        this.ref.detectChanges();
        document.getElementById("thankuFilter").click();

        this.viewByTxnId(this.receiptNo);
      }, err => {
        document.getElementById("failedFilter").click();
        // this.util.alertNotificationMessage("Payment Failed !! Please try Again.")
        if (err.error.redirect) {
          this.showResetbutton = true
        }
      })
  }

  public payWithCashfree(res: any) {
    console.log('Gateway:', this.selectedGatewayMode);

    const paymentSessionId = res.payment_session_id;

    if (!paymentSessionId) {
      console.error('Missing payment_session_id from backend response.');
      return;
    }

    // Create the Cashfree instance
    const cashfree = new Cashfree({ mode: 'production' });
    // change to 'production' later

    // Configure payment options
    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: '_modal',  // opens in popup/modal like Razorpay
    };

    console.log('Launching Cashfree popup...');

    cashfree.checkout(checkoutOptions)
      .then((response: any) => {
        console.log('Payment completed:', response);
        // Handle post-payment verification here if needed
        this.payCashfreeAmount(res);
      })
      .catch((error: any) => {
        console.error('Payment failed or closed:', error);
      });
  }
  payCashfreeAmount(response) {
    this.showPaymentLoadingPopup = true;
    this.paidAmount = this.roundUpToTwoDecimals(response.communication.amount);
    this.receiptNo = response.communication.receipt;

    // Start polling with max 5 attempts
    this.pollPaymentStatus(response.communication.receipt, 1, 5);
    this.ref.detectChanges()
  }

  pollPaymentStatus(receiptNo: string, attemptNumber: number, maxAttempts: number) {
    setTimeout(() => {
      this.service.viewPayment(receiptNo).subscribe(
        res => {
          const status = res.data.status;

          if (status === 'paid') {
            // Payment successful
            this.showPaymentLoadingPopup = false;
            document.getElementById("thankuFilter").click();
            this.viewByTxnId(receiptNo);
            this.ref.detectChanges();
          } else if (status === 'failed') {
            // Payment failed
            this.showPaymentLoadingPopup = false;
            document.getElementById("failedFilter").click();
            this.showResetbutton = true;
            this.ref.detectChanges();
          } else if (status === 'created') {
            // Payment still pending
            if (attemptNumber < maxAttempts) {
              // Call again after 5 seconds
              this.pollPaymentStatus(receiptNo, attemptNumber + 1, maxAttempts);
            } else {
              // Max attempts reached, show failed
              this.showPaymentLoadingPopup = false;
              document.getElementById("failedFilter").click();
              this.showResetbutton = true;
              this.ref.detectChanges();
            }
          } else {
            // Unknown status, treat as failed
            this.showPaymentLoadingPopup = false;
            document.getElementById("failedFilter").click();
            this.showResetbutton = true;
            this.ref.detectChanges();
          }
        },
        err => {
          // Error occurred
          this.showPaymentLoadingPopup = false;
          document.getElementById("failedFilter").click();
          if (err.error && err.error.redirect) {
            this.showResetbutton = true;
          }
          this.ref.detectChanges();
        }
      );
    }, attemptNumber === 1 ? 1000 : 5000); // First call after 1s, subsequent calls after 5s
  }
  payPaytmAmount(response) {
    response.paymentGateway = "paytm"
    this.service.processPayment(response).
      subscribe(res => {
        this.paidAmount = this.roundUpToTwoDecimals(res.data.paidAmount);
        this.receiptNo = res.data.name;
        this.ref.detectChanges();
        document.getElementById("thankuFilter").click();

        this.viewByTxnId(this.receiptNo);
      }, err => {
        document.getElementById("failedFilter").click();
        // this.util.alertNotificationMessage("Payment Failed !! Please try Again.")
        if (err.error.redirect) {
          this.showResetbutton = true
        }
      })
  }

  payRazorAmount(response) {

    response.paymentGateway = "razorpay"
    this.service.processPayment(response).
      subscribe(res => {
        this.paidAmount = this.roundUpToTwoDecimals(res.data.paidAmount);
        this.receiptNo = res.data.name;
        this.ref.detectChanges();
        document.getElementById("thankuFilter").click();
        this.viewByTxnId(this.receiptNo);
      }, err => {
        document.getElementById("failedFilter").click();
        // this.util.alertNotificationMessage("Payment Failed !! Please try Again.")
        if (err.error.redirect) {
          this.showResetbutton = true
        }
      })
  }
  viewByTxnId(name) {
    this.service.viewByTxnId(name)
    .subscribe(res=>{
      this.id = res._id
      this.disableDownload = false;
    },err=>{
      this.disableDownload = true;
      this.util.errmsg(err)
    })
  }
  openTemplateFilter(templateref) {
    this.dialog.open(templateref, { width: '40%', });
  }
  downloadReceipt() {
    this.router.navigate(['/print/open/printAdmissionTransaction/' + this.id, { prev: '/admission/studentData', prevName: 'Admission Application Data', course: this.studentData.course }]); //check
    this.dialog.closeAll();
  }
  closeTemplate() {
    this.dialog.closeAll();
    // this.loadingSplashScreen = true;
  }
  isControlHasError(controlName: string, validationType: string): boolean {
    const control = this.validationForm.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }
  openDialog(templateRef) {
    this.dialog.open(templateRef, { disableClose: true })
  }
    isControlPaymentHasError(controlName: string, validationType: any) {
    const control = this.validationPaymentDevice.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }
  checkPermission(value) {
    if (this.permissions.includes(value)) {
      return true;
    } else {
      return false;
    }
  }
  ngOnDestroy() {
    //window.clearInterval();
  }

}
