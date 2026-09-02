// ============================================================
// CONFIG: Supabase Edge Function "api" のURL
// (バックエンドは Supabase — supabase/ フォルダと setup.txt 参照)
// ============================================================
const API_URL = "https://yczwdkkuaitlbvtskmsf.supabase.co/functions/v1/api";

// ============================================================
// PWA: register service worker so the app is installable on home screen
// ============================================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service_worker.js").then((reg) => {
      // Periodically check for an updated SW so long-lived tabs (kiosk) pick
      // up new versions without needing a manual refresh.
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000); // hourly

      // When a new SW is detected, tell it to take control immediately,
      // then reload the page so the user sees the new version.
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "in stalled" && navigator.serviceWorker.controller) {
            newSW.postMessage("SKIP_WAITING");
          }
        });
      });
    }).catch((err) => {
      console.warn("Service worker registration failed:", err);
    });

    // When the active SW changes (after SKIP_WAITING), reload once so the
    // page is served by the new worker. Guard against infinite reloads.
    let _reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (_reloaded) return;
      _reloaded = true;
      window.location.reload();
    });
  });
}

// ============================================================
// i18n (Vietnamese / Japanese)
// ============================================================
const I18N = {
  vi: {
    appTitle: "Hệ thống chấm công",
    addUserBtn: "+ Đăng ký",
    registerTitle: "Đăng ký người dùng",
    email: "Email",
    fullName: "Họ và tên",
    optional: " (tùy chọn)",
    registerBtn: "Đăng ký",
    cancel: "Hủy",
    sectionBasic: "Thông tin cơ bản",
    sectionContact: "Liên hệ",
    sectionEmployment: "Việc làm",
    sectionBank: "Tài khoản ngân hàng (Việt Nam)",
    positionLabel: "Chức vụ",
    positionAdmin: "Quản trị viên",
    positionEmployee: "Nhân viên chính thức",
    positionParttime: "Nhân viên bán thời gian",
    gender: "Giới tính",
    genderEmpty: "--",
    genderMale: "Nam",
    genderFemale: "Nữ",
    genderOther: "Khác",
    birthDate: "Ngày sinh",
    idNumber: "Số CCCD/CMND",
    phone: "Số điện thoại",
    address: "Địa chỉ",
    emergencyContact: "Liên hệ khẩn cấp",
    hireDate: "Ngày vào làm",
    bankName: "Tên ngân hàng",
    bankBranch: "Chi nhánh",
    bankAccount: "Số tài khoản",
    msgNameRequired: "Vui lòng nhập họ và tên.",
    pickUser: "Chọn nhân viên",
    pickPlaceholder: "-- Chọn --",
    filterByUser: "Lọc theo nhân viên",
    filterAll: "-- Tất cả --",
    clockIn: "Chấm công vào",
    clockOut: "Chấm công ra",
    breakStart: "Bắt đầu nghỉ",
    breakEnd: "Kết thúc nghỉ",
    todayLog: "Lịch sử hôm nay",
    statusOut: "Chưa chấm công",
    statusWorking: "Đang làm việc",
    statusBreak: "Đang nghỉ",
    statusFinished: "Đã kết thúc",
    msgRegisterOk: "Đăng ký thành công.",
    msgEmailExists: "Email này đã được đăng ký.",
    msgClockedIn: "Đã chấm công vào.",
    msgClockedOut: "Đã chấm công ra.",
    msgBreakStart: "Bắt đầu nghỉ.",
    msgBreakEnd: "Kết thúc nghỉ.",
    msgError: "Có lỗi xảy ra. Vui lòng thử lại.",
    msgInvalidAction: "Thao tác không hợp lệ ở trạng thái hiện tại.",
    msgPickUserFirst: "Vui lòng chọn nhân viên trước.",
    logEmpty: "Chưa có dữ liệu.",
    logClockIn: "Chấm công vào",
    logClockOut: "Chấm công ra",
    logBreakStart: "Bắt đầu nghỉ",
    logBreakEnd: "Kết thúc nghỉ",
    tabAttendance: "Chấm công",
    tabShiftRegister: "Đăng ký ca",
    tabShiftManage: "Quản lý ca",
    shiftDate: "Ngày",
    shiftStart: "Bắt đầu",
    shiftEnd: "Kết thúc",
    shiftNote: "Ghi chú",
    registerShiftBtn: "Đăng ký ca",
    myShiftsTitle: "Ca làm việc (tháng này)",
    noShifts: "Chưa có ca nào.",
    deleteShiftBtn: "Xóa",
    deleteConfirm: "Bạn có chắc chắn muốn xóa ca này?",
    msgShiftRegistered: "Đã đăng ký ca làm việc.",
    msgShiftDeleted: "Đã xóa ca làm việc.",
    msgShiftInvalidTime: "Giờ kết thúc phải sau giờ bắt đầu.",
    addShiftTitle: "Đăng ký ca",
    pickPattern: "Chọn mẫu ca",
    customPattern: "Tùy chỉnh",
    editPatterns: "⚙ Mẫu ca",
    editPatternsTitle: "Cài đặt mẫu ca",
    patternLabel: "Mẫu",
    patternName: "Tên",
    saveBtn: "Lưu",
    msgPatternsSaved: "Đã lưu mẫu ca.",
    calHint: "Bấm vào ngày để đăng ký ca",
    weekdaySun: "CN",
    weekdayMon: "T2",
    weekdayTue: "T3",
    weekdayWed: "T4",
    weekdayThu: "T5",
    weekdayFri: "T6",
    weekdaySat: "T7",
    thisWeekBtn: "Tuần này",
    manageHint: "Bấm vào ca để xóa",
    menuTitle: "Menu",
    menuAttendance: "Hệ thống chấm công",
    menuRegister: "Đăng ký người dùng",
    menuTransaction: "Đăng ký giao dịch",
    menuMaster: "Dữ liệu chính",
    masterTitle: "Dữ liệu chính",
    masterTabStore: "Cửa hàng",
    masterTabVendor: "Nhà cung cấp",
    masterTabUser: "Nhân viên",
    newStoreBtn: "+ Đăng ký cửa hàng",
    newVendorBtn: "+ Đăng ký nhà cung cấp",
    newUserBtn: "+ Đăng ký nhân viên",
    userDeleteConfirm: "Xóa nhân viên này? (Dữ liệu chấm công liên quan vẫn còn)",
    storeModalTitle: "Đăng ký cửa hàng",
    vendorModalTitle: "Đăng ký nhà cung cấp",
    storeName: "Tên cửa hàng",
    vendorName: "Tên nhà cung cấp",
    address: "Địa chỉ",
    phone: "Số điện thoại",
    masterEmpty: "Chưa có dữ liệu nào.",
    msgMasterRegistered: "Đã đăng ký.",
    msgMasterDeleted: "Đã xóa.",
    msgDuplicate: "Tên này đã được đăng ký.",
    masterDeleteConfirm: "Xóa mục này?",
    menuDashboard: "Bảng điều khiển",
    dashTitle: "Bảng điều khiển cửa hàng",
    dashInfoBanner: "Doanh thu bao gồm doanh thu ngoài POS, chi phí nhân công bao gồm chi phí nhân công khác. Giá vốn bao gồm khoản mục \"Mua hàng (đồ ăn)\" và \"Mua hàng (đồ uống)\" của quỹ tiền mặt.",
    dashSelectStore: "-- Chọn cửa hàng --",
    dashSelectFirst: "Vui lòng chọn cửa hàng và tháng.",
    enterDailySales: "+ Doanh số hằng ngày",
    enterMonthlyTarget: "+ Mục tiêu tháng",
    dailySalesModalTitle: "Nhập doanh số hằng ngày",
    monthlyTargetModalTitle: "Mục tiêu tháng",
    foodSales: "Doanh số đồ ăn",
    drinkSales: "Doanh số đồ uống",
    otherSales: "Doanh số khác (ngoài POS)",
    customers: "Số khách",
    totalSalesIncl: "Tổng doanh số (gồm thuế)",
    totalSalesExcl: "Tổng doanh số (chưa thuế)",
    foodSalesIncl: "Doanh số đồ ăn (gồm thuế)",
    foodSalesExcl: "Doanh số đồ ăn (chưa thuế)",
    drinkSalesIncl: "Doanh số đồ uống (gồm thuế)",
    drinkSalesExcl: "Doanh số đồ uống (chưa thuế)",
    paymentCash: "Tiền mặt",
    paymentQr: "QR",
    paymentCard: "Thẻ tín dụng",
    discountAmount: "Số tiền giảm giá",
    depositAmount: "Số tiền nhập",
    pettyCashAmount: "Tiền quỹ nhỏ sử dụng",
    copyReportBtn: "Sao chép báo cáo (tiếng Nhật)",
    msgReportCopied: "Đã sao chép báo cáo vào clipboard",
    dashPaymentsLabel: "Cơ cấu thanh toán",
    dashPaymentsSub: "(Tiền mặt + QR + Thẻ)",
    dashOtherLabel: "Khác",
    dashOtherSub: "Giảm giá / Nhập tiền / Quỹ nhỏ",
    dashSalesInclLabel: "Gồm thuế",
    dashSalesExclLabel: "Chưa thuế",
    dashRangeLabel: "Kỳ",
    dashRangeToday: "Hôm nay",
    dashRangeYesterday: "Hôm qua",
    dashRangeThisMonth: "Tháng này",
    dashTotalSalesLabel: "Doanh số",
    yearMonth: "Tháng",
    salesTargets: "Mục tiêu doanh số",
    foodSalesTarget: "Mục tiêu đồ ăn",
    drinkSalesTarget: "Mục tiêu đồ uống",
    otherSalesTarget: "Mục tiêu khác",
    costRatioTargets: "Mục tiêu tỷ lệ",
    foodCostRatioTarget: "Tỷ lệ chi phí đồ ăn",
    drinkCostRatioTarget: "Tỷ lệ chi phí đồ uống",
    laborCostRatioTarget: "Tỷ lệ nhân công mục tiêu",
    laborSection: "Chi phí nhân công thực tế",
    monthlyLaborCost: "Chi phí nhân công tháng",
    upsertHint: "※ Cùng cửa hàng + ngày sẽ ghi đè dữ liệu cũ",
    saveBtn: "Lưu",
    dailySalesList: "Lịch sử doanh số hằng ngày",
    dashSalesLabel: "Doanh số",
    dashSalesSub: "Tổng (đồ ăn + đồ uống + khác)",
    dashAvgPerCustomer: "Đơn giá/khách",
    dashCustomers: "Số khách",
    dashTodayPace: "Tỷ lệ đạt mục tiêu kỳ đã chọn",
    dashMonthlyProgress: "Tỷ lệ tiến độ tháng",
    dashCostRatio: "Tỷ lệ chi phí",
    dashTarget: "MT",
    dashFood: "Đồ ăn",
    dashDrink: "Đồ uống",
    dashLaborRatio: "Tỷ lệ nhân công",
    dashLaborCost: "Chi phí nhân công",
    dashProfit: "Lợi nhuận",
    dashProfitRatio: "Tỷ lệ lợi nhuận",
    dashAttLabor: "Chấm công",
    dashOtherLabor: "Khác",
    dashSalesPerHour: "Doanh thu / giờ",
    dashTotalHours: "Tổng giờ",
    userStore: "Cửa hàng",
    hourlyRate: "Lương theo giờ",
    dailyRate: "Lương theo ngày",
    laborCostModalTitle: "Chỉnh sửa chi phí nhân công khác",
    otherLaborCostLabel: "Chi phí nhân công khác (cố định, thưởng, BHXH...)",
    otherLaborHint: "※ Phần lương theo giờ từ chấm công được tự động tính riêng.",
    editLabel: "✎ Sửa",
    msgSaved: "Đã lưu.",
    selectStore: "-- Chọn cửa hàng --",
    selectVendor: "-- Chọn nhà cung cấp --",
    paymentMethod: "Phương thức thanh toán",
    addItemBtn: "+ Thêm mục",
    msgAtLeastOneItem: "Cần ít nhất 1 mục",
    msgItemsRegistered: "mục đã đăng ký",
    menuAttendanceManage: "Sửa chấm công",
    menuAttendanceSummary: "Tổng hợp chấm công",
    pickStore: "Chọn cửa hàng",
    pickStorePlaceholder: "-- Chọn cửa hàng --",
    filterByStore: "Lọc theo cửa hàng",
    filterStoreAll: "-- Tất cả cửa hàng --",
    msgPickStoreFirst: "Vui lòng chọn cửa hàng trước.",
    attMngStore: "Cửa hàng",
    attSumTitle: "Tổng hợp chấm công",
    attSumBanner: "Tổng hợp theo cửa hàng đã chấm công. Ca làm ở cửa hàng khác được tính cho cửa hàng đó.",
    attSumEmpty: "Không có dữ liệu chấm công trong tháng này.",
    colStore: "Cửa hàng",
    colEmployee: "Nhân viên",
    colWorkDays: "Số ngày",
    colWorkHours: "Số giờ",
    colRate: "Đơn giá",
    colLaborCost: "Chi phí nhân công",
    rateTypeHourly: "Theo giờ",
    rateTypeDaily: "Theo ngày",
    awayBadge: "Hỗ trợ",
    attSumTotal: "Tổng cộng",
    attSumPeople: "{n} người",
    attUnclosedTitle: "⚠ Có người chưa chấm công ra",
    attUnclosedRow: "{name} — {store} — vào lúc {at} ({hours} giờ trước)",
    attUnclosedHint: "Nếu để nguyên, toàn bộ thời gian này sẽ bị tính vào chi phí nhân công. Vui lòng sửa lại.",
    attMngTitle: "Quản lý chấm công",
    attMngAllUsers: "-- Tất cả --",
    attMngPickUserFirst: "Vui lòng chọn nhân viên",
    attMngTotalHoursLabel: "Tổng giờ làm trong tháng",
    attMngTotalDaysLabel: "Số ngày làm",
    attMngAddBtn: "+ Thêm bản ghi",
    attMngUser: "Nhân viên",
    attMngTime: "Giờ",
    attMngType: "Loại",
    attMngEmpty: "Không có bản ghi trong kỳ này",
    attEditTitle: "Sửa bản ghi",
    attAddTitle: "Thêm bản ghi",
    deleteBtn: "Xóa",
    msgAttendanceUpdated: "Đã cập nhật bản ghi",
    msgAttendanceDeleted: "Đã xóa bản ghi",
    msgAttendanceAdded: "Đã thêm bản ghi",
    msgDeleteConfirm: "Xóa bản ghi này?",
    payCash: "Tiền mặt",
    payTransfer: "Chuyển khoản ngay",
    payTransferEom: "Chuyển khoản cuối tháng",
    payCard: "Thẻ tín dụng/ghi nợ",
    payMomo: "Momo",
    payZaloPay: "ZaloPay",
    payVnPay: "VNPay",
    payOther: "Khác",
    msgNoStores: "Vui lòng đăng ký cửa hàng trước (Dữ liệu chính → Cửa hàng).",
    hintIdle: "Chạm vào mẫu ca để chọn (hoặc chạm vào ngày để nhập tự do)",
    hintArmed: "đang chọn — chạm vào ngày để thêm/xóa",
    hintNoUser: "Vui lòng chọn nhân viên trước",
    txTitle: "Đăng ký giao dịch",
    txTabPurchase: "Mua hàng",
    txTabPetty: "Quỹ tiền mặt",
    txTabStocktake: "Kiểm kê",
    stkProgress: "Tiến độ kiểm kê",
    stkCurrentTotal: "Tháng này",
    stkPrevTotal: "Tháng trước",
    stkDiff: "Chênh lệch",
    stkTotalRow: "Tổng cộng",
    lastPurchaseLabel: "Mua",
    newLocationBtn: "+ Thêm khu vực lưu trữ",
    locationModalTitle: "Thêm khu vực lưu trữ",
    locationName: "Tên khu vực",
    stkNoLocations: "Chưa có khu vực nào. Hãy thêm khu vực lưu trữ.",
    stkNoEntries: "Chưa có sản phẩm. Bấm \"+ Thêm sản phẩm\" để bắt đầu.",
    stkLocationItems: "sản phẩm",
    stkStatusDone: "Đã xong",
    stkStatusTodo: "Chưa nhập",
    stkStatusEmpty: "Trống",
    stkUpdated: "Cập nhật",
    stkAddItem: "+ Thêm sản phẩm",
    stkAddItemTitle: "Thêm sản phẩm",
    stkCopyPrev: "Sao chép từ tháng trước",
    stkFromInventory: "Từ danh sách đã có",
    stkManualAdd: "Thêm thủ công",
    stkSuggestionEmpty: "Không có sản phẩm nào. Hãy nhập sản phẩm đầu tiên thủ công.",
    stkEntered: "đã nhập",
    stkSubtotal: "Tổng cộng",
    addItemBtn: "+ Thêm",
    unit: "Đơn vị",
    unitPriceLabel: "Đơn giá (đã có thuế)",
    productName: "Tên sản phẩm",
    pettyProductName: "Tên hàng mua",
    back: "Quay lại",
    close: "Đóng",
    stkLocationDeleteConfirm: "Xóa khu vực này? (Dữ liệu kiểm kê sẽ vẫn còn)",
    stkEntryDeleteConfirm: "Xóa sản phẩm này khỏi kiểm kê?",
    msgCopied: "Đã sao chép {n} sản phẩm.",
    storeAll: "-- Tất cả cửa hàng --",
    newEntry: "+ Đăng ký mới",
    pettyBanner: "💡 Giao dịch quỹ tiền mặt được phân loại theo khoản mục.",
    pettyTotalIn: "Tổng thu",
    pettyTotalOut: "Tổng chi",
    purchaseModalTitle: "Đăng ký mua hàng",
    pettyModalTitle: "Đăng ký giao dịch quỹ tiền mặt",
    purchaseDate: "Ngày mua",
    store: "Cửa hàng",
    vendor: "Nhà cung cấp",
    productName: "Tên sản phẩm",
    specification: "Quy cách",
    category: "Khoản mục",
    subCategory: "Khoản mục phụ",
    unitPrice: "Đơn giá (chưa thuế)",
    quantity: "Số lượng",
    taxRate: "Thuế suất",
    amountInclTax: "Số tiền (có thuế)",
    amountExclTax: "Tiền chưa thuế",
    txType: "Loại",
    typeOut: "Chi (xuất quỹ)",
    typeIn: "Thu (nhập quỹ)",
    taxCode: "Mã số thuế (MST)",
    note: "Ghi chú",
    date: "Ngày",
    catSeafood: "Hải sản",
    catMeat: "Thịt",
    catVeg: "Rau củ",
    catBev: "Đồ uống",
    catSpice: "Gia vị",
    catSupplies: "Vật tư",
    catFood: "Thực phẩm",
    catDrink: "Đồ uống",
    catConsumables: "Vật tư tiêu hao",
    catServiceFee: "Phí dịch vụ",
    catStaffMeal: "Đồ ăn nhân viên",
    catEquipment: "Vật tư",
    catPurchaseFood: "Mua hàng (đồ ăn)",
    catPurchaseDrink: "Mua hàng (đồ uống)",
    catReserveDeposit: "Nạp quỹ chuẩn bị",
    catUtilities: "Điện nước",
    catCommunication: "Viễn thông",
    catOfficeSupplies: "Văn phòng phẩm",
    catTravel: "Đi lại",
    catEntertainment: "Tiếp khách",
    catBankFee: "Phí ngân hàng",
    catOther: "Khác",
    unitPriceInclTax: "Đơn giá (có thuế)",
    paymentStatus: "Trạng thái thanh toán",
    payStatusPaid: "Đã thanh toán",
    payStatusUnpaid: "Chưa thanh toán",
    exportCsv: "⬇ CSV",
    exportCsvAll: "⬇ CSV (Mua hàng + Quỹ)",
    msgCsvExported: "Đã tải xuống {n} dòng.",
    msgCsvSkippedIn: "({n} giao dịch thu không được xuất)",
    msgCsvEmpty: "Không có dữ liệu để xuất.",
    filterVendorAll: "-- Tất cả nhà cung cấp --",
    filterMethodAll: "Tất cả",
    filterTypeAll: "Tất cả",
    methodManual: "Thủ công",
    methodAuto: "Tự động",
    colPurchaseDate: "Ngày mua",
    colUnitPriceExcl: "Đơn giá (chưa thuế)",
    colOrderQty: "Số lượng",
    colAmountExcl: "Thành tiền (chưa thuế)",
    colUnitPriceIncl: "Đơn giá (có thuế)",
    colAmountIncl: "Thành tiền (có thuế)",
    colProductType: "Loại hàng",
    colMethod: "Cách đăng ký",
    colDelete: "Xóa",
    pagerSummary: "{from}–{to} / {total} dòng",
    pagerPerPage: "{n} dòng/trang",
    pagerAll: "Tất cả",
    txEmpty: "Chưa có giao dịch nào.",
    msgTxRegistered: "Đã đăng ký giao dịch.",
    msgTxDeleted: "Đã xóa giao dịch.",
    msgRequiredFields: "Vui lòng nhập các trường bắt buộc.",
    txDeleteConfirm: "Xóa giao dịch này?",
    colHomeStore: "Cửa hàng trực thuộc",
    colRateType: "Loại đơn giá",
    perDaySuffix: "/ngày",
    currencyPerDay: "VND/ngày",
    dashRangeDaysFmt: "({total} ngày / đã qua {elapsed} ngày)",
    unitPeople: "khách",
    unitDaysFmt: "{n} ngày",
    chipIn: "Vào",
    chipOut: "Ra",
    chipBreakFmt: "Nghỉ {n}",
    chipUnclosed: "⚠ Chưa ra",
    dsReportTitle: "【Báo cáo doanh thu ngày】",
    dsReportSalesSection: "▼ Doanh thu",
    dsReportPaymentSection: "▼ Thanh toán",
    dsReportOtherSection: "▼ Khác",
    dsReportNoStore: "(chưa chọn)",
    dsReportNoDate: "(chưa nhập)",
    avgPerCustomerIncl: "Doanh thu TB/khách (gồm thuế)",
    avgPerCustomerExcl: "Doanh thu TB/khách (chưa thuế)",
    locNamePlaceholder: "Ví dụ: Kho, kệ đồ uống...",
    unitPlaceholder: "cái / kg / PC",
    editUserTitle: "Chỉnh sửa người dùng",
    editBtn: "Sửa",
    msgUserUpdated: "Đã cập nhật.",
    noRateBanner: "⚠ Chưa cài đơn giá lương (chi phí nhân công = 0): {names}",
    tabShiftGrid: "Bảng ca",
    sgHint: "Chạm vào ô để đăng ký / xóa ca làm việc",
    sgStaffCount: "Số người",
    sgHoursRow: "Số giờ",
    sgLaborRow: "Chi phí NC (dự kiến)",
    colTotal: "Tổng",
    sgAddShift: "Thêm ca làm việc",
  },
  ja: {
    appTitle: "勤怠システム",
    addUserBtn: "+ ユーザー登録",
    registerTitle: "ユーザー登録",
    email: "メールアドレス",
    fullName: "氏名",
    optional: " (任意)",
    registerBtn: "登録する",
    cancel: "キャンセル",
    sectionBasic: "基本情報",
    sectionContact: "連絡先",
    sectionEmployment: "雇用情報",
    sectionBank: "振込先 (ベトナム)",
    positionLabel: "役職",
    positionAdmin: "管理者",
    positionEmployee: "一般社員",
    positionParttime: "アルバイト",
    gender: "性別",
    genderEmpty: "--",
    genderMale: "男性",
    genderFemale: "女性",
    genderOther: "その他",
    birthDate: "生年月日",
    idNumber: "ID番号",
    phone: "電話番号",
    address: "住所",
    emergencyContact: "緊急連絡先",
    hireDate: "入社日",
    bankName: "銀行名",
    bankBranch: "支店名",
    bankAccount: "口座番号",
    msgNameRequired: "氏名を入力してください。",
    pickUser: "ユーザーを選択",
    pickPlaceholder: "-- 選択してください --",
    filterByUser: "ユーザーで絞り込み",
    filterAll: "-- 全員 --",
    clockIn: "出勤",
    clockOut: "退勤",
    breakStart: "休憩開始",
    breakEnd: "休憩終了",
    todayLog: "本日の打刻履歴",
    statusOut: "未出勤",
    statusWorking: "勤務中",
    statusBreak: "休憩中",
    statusFinished: "退勤済",
    msgRegisterOk: "登録が完了しました。",
    msgEmailExists: "このメールアドレスは既に登録されています。",
    msgClockedIn: "出勤を記録しました。",
    msgClockedOut: "退勤を記録しました。",
    msgBreakStart: "休憩を開始しました。",
    msgBreakEnd: "休憩を終了しました。",
    msgError: "エラーが発生しました。もう一度お試しください。",
    msgInvalidAction: "現在の状態では実行できない操作です。",
    msgPickUserFirst: "先にユーザーを選択してください。",
    logEmpty: "データがありません。",
    logClockIn: "出勤",
    logClockOut: "退勤",
    logBreakStart: "休憩開始",
    logBreakEnd: "休憩終了",
    tabAttendance: "勤怠",
    tabShiftRegister: "シフト登録",
    tabShiftManage: "シフト管理",
    shiftDate: "日付",
    shiftStart: "開始時刻",
    shiftEnd: "終了時刻",
    shiftNote: "備考",
    registerShiftBtn: "シフトを登録",
    myShiftsTitle: "シフト一覧 (今月)",
    noShifts: "シフトが登録されていません。",
    deleteShiftBtn: "削除",
    deleteConfirm: "このシフトを削除してもよろしいですか?",
    msgShiftRegistered: "シフトを登録しました。",
    msgShiftDeleted: "シフトを削除しました。",
    msgShiftInvalidTime: "終了時刻は開始時刻より後である必要があります。",
    addShiftTitle: "シフト登録",
    pickPattern: "シフトパターンを選択",
    customPattern: "カスタム",
    editPatterns: "⚙ パターン編集",
    editPatternsTitle: "シフトパターン設定",
    patternLabel: "パターン",
    patternName: "名前",
    saveBtn: "保存",
    msgPatternsSaved: "シフトパターンを保存しました。",
    calHint: "日付をタップしてシフトを登録",
    weekdaySun: "日",
    weekdayMon: "月",
    weekdayTue: "火",
    weekdayWed: "水",
    weekdayThu: "木",
    weekdayFri: "金",
    weekdaySat: "土",
    thisWeekBtn: "今週",
    manageHint: "シフトをタップで削除",
    menuTitle: "メニュー",
    menuAttendance: "勤怠システム",
    menuRegister: "ユーザー登録",
    menuTransaction: "取引登録",
    menuMaster: "マスタ登録",
    masterTitle: "マスタ登録",
    masterTabStore: "店舗",
    masterTabVendor: "取引先",
    masterTabUser: "ユーザー",
    newStoreBtn: "+ 店舗を登録",
    newVendorBtn: "+ 取引先を登録",
    newUserBtn: "+ ユーザーを登録",
    userDeleteConfirm: "このユーザーを削除しますか? (関連する勤怠データは残ります)",
    storeModalTitle: "店舗登録",
    vendorModalTitle: "取引先登録",
    storeName: "店舗名",
    vendorName: "取引先名",
    address: "住所",
    phone: "電話番号",
    masterEmpty: "登録されたデータがありません。",
    msgMasterRegistered: "登録しました。",
    msgMasterDeleted: "削除しました。",
    msgDuplicate: "この名前は既に登録されています。",
    masterDeleteConfirm: "この項目を削除しますか?",
    menuDashboard: "店舗ダッシュボード",
    dashTitle: "店舗管理ダッシュボード",
    dashInfoBanner: "売上には「POS外売上」、人件費には「その他人件費」が含まれます。原価には小口現金の「仕入れ (フード)」「仕入れ (ドリンク)」が含まれます。",
    dashSelectStore: "-- 店舗を選択 --",
    dashSelectFirst: "店舗と月を選択してください。",
    enterDailySales: "+ デイリー売上を入力",
    enterMonthlyTarget: "+ 月次目標を設定",
    dailySalesModalTitle: "デイリー売上入力",
    monthlyTargetModalTitle: "月次目標設定",
    foodSales: "フード売上",
    drinkSales: "ドリンク売上",
    otherSales: "その他売上 (POS外)",
    customers: "ご来店人数",
    totalSalesIncl: "売上合計（税込）",
    totalSalesExcl: "売上合計（税抜）",
    foodSalesIncl: "フード売上（税込）",
    foodSalesExcl: "フード売上（税抜）",
    drinkSalesIncl: "ドリンク売上（税込）",
    drinkSalesExcl: "ドリンク売上（税抜）",
    paymentCash: "売上 現金",
    paymentQr: "売上 QR",
    paymentCard: "売上 クレジットカード",
    discountAmount: "割引金額",
    depositAmount: "入金金額",
    pettyCashAmount: "小口使用金額",
    copyReportBtn: "日本語の報告書をコピー",
    msgReportCopied: "報告書をクリップボードにコピーしました",
    dashPaymentsLabel: "支払方法内訳",
    dashPaymentsSub: "(現金 + QR + クレジットカード)",
    dashOtherLabel: "その他",
    dashOtherSub: "割引 / 入金 / 小口使用",
    dashSalesInclLabel: "税込",
    dashSalesExclLabel: "税抜",
    dashRangeLabel: "期間",
    dashRangeToday: "本日",
    dashRangeYesterday: "昨日",
    dashRangeThisMonth: "今月",
    dashTotalSalesLabel: "売上",
    yearMonth: "対象月",
    salesTargets: "売上目標",
    foodSalesTarget: "フード売上目標",
    drinkSalesTarget: "ドリンク売上目標",
    otherSalesTarget: "その他売上目標",
    costRatioTargets: "目標比率",
    foodCostRatioTarget: "フード原価率目標",
    drinkCostRatioTarget: "ドリンク原価率目標",
    laborCostRatioTarget: "人件費率目標",
    laborSection: "実際の人件費",
    monthlyLaborCost: "月次人件費",
    upsertHint: "※ 同じ店舗・同じ日付の場合は上書き登録になります",
    saveBtn: "保存",
    dailySalesList: "デイリー売上履歴",
    dashSalesLabel: "売上",
    dashSalesSub: "(フード + ドリンク + その他)",
    dashAvgPerCustomer: "客単価",
    dashCustomers: "客数",
    dashTodayPace: "設定期間目標達成率",
    dashMonthlyProgress: "月次進捗率",
    dashCostRatio: "原価率",
    dashTarget: "目標",
    dashFood: "フード",
    dashDrink: "ドリンク",
    dashLaborRatio: "人件費率",
    dashLaborCost: "人件費",
    dashProfit: "利益",
    dashProfitRatio: "利益率",
    dashAttLabor: "勤怠連動",
    dashOtherLabor: "その他人件費",
    dashSalesPerHour: "人時売上高",
    dashTotalHours: "合計勤務時間",
    userStore: "所属店舗",
    hourlyRate: "時給",
    dailyRate: "日給",
    laborCostModalTitle: "その他人件費の編集",
    otherLaborCostLabel: "その他人件費 (固定給・賞与・社保負担分など)",
    otherLaborHint: "※ 勤怠から自動計算される時給分は別途加算されます。",
    editLabel: "✎ 編集",
    msgSaved: "保存しました。",
    selectStore: "-- 店舗を選択 --",
    selectVendor: "-- 取引先を選択 --",
    paymentMethod: "支払い方法",
    addItemBtn: "+ アイテムを追加",
    msgAtLeastOneItem: "アイテムは最低1件必要です",
    msgItemsRegistered: "件 登録しました",
    menuAttendanceManage: "勤怠管理",
    menuAttendanceSummary: "勤怠集計",
    pickStore: "店舗を選択",
    pickStorePlaceholder: "-- 店舗を選択 --",
    filterByStore: "店舗で絞り込み",
    filterStoreAll: "-- 全店舗 --",
    msgPickStoreFirst: "先に店舗を選択してください。",
    attMngStore: "店舗",
    attSumTitle: "勤怠集計（従業員別×店舗別）",
    attSumBanner: "打刻した店舗ごとに集計しています。所属店舗以外での勤務はその店舗側に計上されます。",
    attSumEmpty: "この月の勤怠データがありません。",
    colStore: "店舗",
    colEmployee: "従業員",
    colWorkDays: "出勤日数",
    colWorkHours: "労働時間",
    colRate: "単価",
    colLaborCost: "人件費",
    rateTypeHourly: "時給",
    rateTypeDaily: "日給",
    awayBadge: "応援",
    attSumTotal: "合計",
    attSumPeople: "{n} 名",
    attUnclosedTitle: "⚠ 退勤打刻が済んでいない人がいます",
    attUnclosedRow: "{name} — {store} — {at} に出勤（{hours} 時間経過）",
    attUnclosedHint: "このままだと全時間が人件費に計上されます。打刻を修正してください。",
    attMngTitle: "勤怠管理(一覧・修正)",
    attMngAllUsers: "-- 全ユーザー --",
    attMngPickUserFirst: "従業員を選択してください",
    attMngTotalHoursLabel: "月間総労働時間",
    attMngTotalDaysLabel: "出勤日数",
    attMngAddBtn: "+ 打刻を追加",
    attMngUser: "ユーザー",
    attMngTime: "時刻",
    attMngType: "種別",
    attMngEmpty: "対象期間に打刻はありません",
    attEditTitle: "打刻を編集",
    attAddTitle: "打刻を追加",
    deleteBtn: "削除",
    msgAttendanceUpdated: "打刻を更新しました",
    msgAttendanceDeleted: "打刻を削除しました",
    msgAttendanceAdded: "打刻を追加しました",
    msgDeleteConfirm: "この打刻を削除しますか?",
    payCash: "現金",
    payTransfer: "銀行即時振込",
    payTransferEom: "銀行月末振込",
    payCard: "クレジット/デビットカード",
    payMomo: "Momo",
    payZaloPay: "ZaloPay",
    payVnPay: "VNPay",
    payOther: "その他",
    msgNoStores: "先に店舗をマスタ登録してください (マスタ登録 → 店舗)。",
    hintIdle: "シフトパターンをタップして選択 (または日付タップで個別入力)",
    hintArmed: "選択中 — 日付タップで登録/解除",
    hintNoUser: "先にユーザーを選択してください",
    txTitle: "取引登録",
    txTabPurchase: "仕入れ登録",
    txTabPetty: "小口現金",
    txTabStocktake: "棚卸",
    stkProgress: "棚卸進捗",
    stkCurrentTotal: "当月棚卸高",
    stkPrevTotal: "前月棚卸高",
    stkDiff: "前月差",
    stkTotalRow: "合計",
    lastPurchaseLabel: "仕入",
    newLocationBtn: "+ 保管場所を追加",
    locationModalTitle: "保管場所を追加",
    locationName: "保管場所名",
    stkNoLocations: "保管場所がありません。「+ 保管場所を追加」から登録してください。",
    stkNoEntries: "商品が未登録です。「+ 商品を追加」から開始してください。",
    stkLocationItems: "品目",
    stkStatusDone: "完了",
    stkStatusTodo: "未入力",
    stkStatusEmpty: "なし",
    stkUpdated: "更新",
    stkAddItem: "+ 商品を追加",
    stkAddItemTitle: "商品を追加",
    stkCopyPrev: "前月から複製",
    stkFromInventory: "登録済み商品から",
    stkManualAdd: "手入力で追加",
    stkSuggestionEmpty: "登録済み商品がありません。手入力で追加してください。",
    stkEntered: "入力済",
    stkSubtotal: "合計",
    addItemBtn: "+ 追加",
    unit: "単位",
    unitPriceLabel: "単価 (税込)",
    productName: "商品名",
    pettyProductName: "購入物名",
    back: "戻る",
    close: "閉じる",
    stkLocationDeleteConfirm: "この保管場所を削除しますか? (棚卸データは残ります)",
    stkEntryDeleteConfirm: "この商品を棚卸から削除しますか?",
    msgCopied: "{n} 件複製しました。",
    storeAll: "-- 全店舗 --",
    newEntry: "+ 新規登録",
    pettyBanner: "💡 小口現金取引は科目・補助科目別に分類されます。",
    pettyTotalIn: "入金合計",
    pettyTotalOut: "出金合計",
    purchaseModalTitle: "仕入れ登録",
    pettyModalTitle: "小口現金取引登録",
    purchaseDate: "仕入日",
    store: "店舗",
    vendor: "取引先",
    productName: "商品名",
    specification: "規格",
    category: "科目",
    subCategory: "補助科目",
    unitPrice: "単価（税抜）",
    quantity: "注文数量",
    taxRate: "税率",
    amountInclTax: "金額（税込）",
    amountExclTax: "金額（税抜）",
    txType: "入出金区分",
    typeOut: "出金",
    typeIn: "入金",
    taxCode: "MST(納税者番号)",
    note: "備考",
    date: "日付",
    catSeafood: "海産物",
    catMeat: "肉類",
    catVeg: "野菜",
    catBev: "飲料",
    catSpice: "調味料",
    catSupplies: "備品",
    catFood: "フード",
    catDrink: "ドリンク",
    catConsumables: "消耗品",
    catServiceFee: "サービス料",
    catStaffMeal: "まかない",
    catEquipment: "備品",
    catPurchaseFood: "仕入れ (フード)",
    catPurchaseDrink: "仕入れ (ドリンク)",
    catReserveDeposit: "準備金入金",
    catUtilities: "水道光熱費",
    catCommunication: "通信費",
    catOfficeSupplies: "消耗品費",
    catTravel: "旅費交通費",
    catEntertainment: "接待交際費",
    catBankFee: "支払手数料",
    catOther: "その他",
    unitPriceInclTax: "単価（税込）",
    paymentStatus: "支払状況",
    payStatusPaid: "支払済",
    payStatusUnpaid: "未払",
    exportCsv: "⬇ CSV",
    exportCsvAll: "⬇ CSV (仕入れ+小口)",
    msgCsvExported: "{n} 件をダウンロードしました。",
    msgCsvSkippedIn: "(小口の入金 {n} 件は対象外)",
    msgCsvEmpty: "出力するデータがありません。",
    filterVendorAll: "-- 取引先で絞り込み --",
    filterMethodAll: "全て",
    filterTypeAll: "全て",
    methodManual: "手動",
    methodAuto: "自動",
    colPurchaseDate: "仕入日",
    colUnitPriceExcl: "単価（税別）",
    colOrderQty: "注文数量",
    colAmountExcl: "仕入金額（税別）",
    colUnitPriceIncl: "単価（税込）",
    colAmountIncl: "金額（税込）",
    colProductType: "商品タイプ",
    colMethod: "登録方法",
    colDelete: "削除",
    pagerSummary: "{from}–{to} / {total} 件",
    pagerPerPage: "{n} 件/ページ",
    pagerAll: "全て",
    txEmpty: "取引データがありません。",
    msgTxRegistered: "取引を登録しました。",
    msgTxDeleted: "取引を削除しました。",
    msgRequiredFields: "必須項目を入力してください。",
    txDeleteConfirm: "この取引を削除しますか?",
    colHomeStore: "所属店舗",
    colRateType: "単価種別",
    perDaySuffix: "/日",
    currencyPerDay: "VND/日",
    dashRangeDaysFmt: "({total}日間 / 経過{elapsed}日)",
    unitPeople: "人",
    unitDaysFmt: "{n}日",
    chipIn: "出",
    chipOut: "退",
    chipBreakFmt: "休 {n}回",
    chipUnclosed: "⚠ 退勤未",
    dsReportTitle: "【日次売上報告】",
    dsReportSalesSection: "▼ 売上",
    dsReportPaymentSection: "▼ 支払内訳",
    dsReportOtherSection: "▼ その他",
    dsReportNoStore: "(未選択)",
    dsReportNoDate: "(未入力)",
    avgPerCustomerIncl: "客単価（税込）",
    avgPerCustomerExcl: "客単価（税抜）",
    locNamePlaceholder: "例: ストッカー, ドリンク棚...",
    unitPlaceholder: "個 / kg / PC",
    editUserTitle: "ユーザー編集",
    editBtn: "編集",
    msgUserUpdated: "更新しました。",
    noRateBanner: "⚠ 単価未設定(人件費0円で計算中): {names}",
    tabShiftGrid: "シフト表",
    sgHint: "セルをタップしてシフトを登録・削除できます",
    sgStaffCount: "人数",
    sgHoursRow: "時間",
    sgLaborRow: "人件費(見込)",
    colTotal: "合計",
    sgAddShift: "シフトを追加",
  },
};

// ============================================================
// State
// ============================================================
let currentLang = localStorage.getItem("lang") || "vi";
let users = []; // [{id, name, email}]
let attendanceUserId = ""; // selected user on attendance tab
let attendanceUserInfo = null; // {name, role} of the selected user — used to
                                // skip a backend Users-sheet read on every punch
let shiftUserId = ""; // selected user on shift register tab
let manageFilterUserId = ""; // optional filter on shift manage tab
let currentStatus = "out"; // out | in | break | finished
let currentTab = "attendance";
let manageWeekStart = null; // Date object pointing to Monday 00:00 of viewed week

// Calendar / patterns
let patterns = []; // 3 patterns from server [{id, name, startTime, endTime, color}]
let calYear = null;
let calMonth = null; // 1-12
let calShiftsByDate = {}; // { "yyyy-MM-dd": [shift, ...] }
let modalDate = "";
let modalPatternId = ""; // "P1" | "P2" | "P3" | "custom"
let armedPatternId = null; // when set, tapping a calendar date toggles that pattern

// ============================================================
// i18n helpers
// ============================================================
function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || key;
}

function applyLanguage() {
  document.documentElement.lang = currentLang === "ja" ? "ja" : "vi";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  // placeholder / title 属性も翻訳する
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });

  // Re-render dynamic content that contains translated text
  updateStatusBadge();
  refreshUserPickerOptions();
  updateArmedHint();
  if (currentTab === "shiftManage") loadManageShifts();
  if (currentTab === "shiftRegister") renderCalendar();
  // 取引一覧はヘッダーも含めてJSで組み立てているので、描画し直さないと
  // 前の言語のままになる。表が既に出ているときだけ再描画する
  // (= データ取得済み。起動直後の初回呼び出しでは何もしない)。
  if (document.querySelector("#purchaseList .tx-table")) {
    refreshVendorOptions();
    renderPurchaseList();
  }
  if (document.querySelector("#pettyList .tx-table")) {
    refreshVendorOptions();
    renderPettyList();
  }
  // ダッシュボード: 取得済みデータがあれば同じデータで描画し直す
  if (dashLastData) {
    renderDashboard(dashLastData);
    renderDailySalesList(dashLastDailyItems);
  }
  // 勤怠集計 (テーブル・カードはJSで組み立てているため再描画が必要)
  if (attSumState.totals) renderAttendanceSummary();
  // 勤怠管理カレンダー (出/退/休チップと集計値)
  if (attCalState.userId && attCalState.year !== null) {
    renderAttendanceCalendar();
    updateAttMonthSummary();
  }
  // シフト表 (ヘッダー・サマリー行・凡例に翻訳を含む)
  if (currentTab === "shiftGrid" && sgState.year !== null) {
    renderSgLegend();
    renderShiftGrid();
  }
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem("lang", currentLang);
    applyLanguage();
  });
});

// ============================================================
// Screen / loading / toast
// ============================================================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function showLoading(show) {
  document.getElementById("loading").classList.toggle("hidden", !show);
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show " + type;
  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

// ============================================================
// API
// ============================================================
let _apiInflight = 0;
async function api(action, payload = {}) {
  _apiInflight++;
  showLoading(true);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: t("msgError") };
  } finally {
    _apiInflight--;
    if (_apiInflight === 0) {
      showLoading(false);
      document.dispatchEvent(new CustomEvent("apiend"));
    }
  }
}

// Auto-disable a form's submit button while any API call is in flight.
// Listens in the capture phase so it runs before each form's own submit
// handler (which then awaits the API call).
document.addEventListener("submit", (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const btn = form.querySelector('button[type="submit"]');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  const restore = () => { btn.disabled = false; };
  document.addEventListener("apiend", restore, { once: true });
  // Failsafe: re-enable after 15s in case no API call ever fires.
  setTimeout(() => {
    btn.disabled = false;
    document.removeEventListener("apiend", restore);
  }, 15000);
}, true);

// ============================================================
// Users (kiosk picker)
// ============================================================
async function loadUsers() {
  const result = await api("listUsers");
  if (result.success) {
    users = result.users || [];
    refreshUserPickerOptions();
  }
}

// ------------------------------------------------------------
// 店舗セレクタ (打刻 / シフト / 勤怠)
// 打刻は「どの店舗で働いたか」を毎回選んでもらう。所属店舗ではなく
// 打刻時に選ばれた店舗が人件費の計上先になる。
// ------------------------------------------------------------
let attendanceStore = "";
let shiftStore = "";
let manageFilterStore = "";
let kioskStores = [];

async function loadKioskStores() {
  const r = await api("listStores");
  if (r && r.success) kioskStores = r.stores || [];
  refreshStorePickerOptions();
}

function refreshStorePickerOptions() {
  const pickers = [
    { id: "storePickerAttendance", placeholderKey: "pickStorePlaceholder", value: attendanceStore },
    { id: "storePickerShift", placeholderKey: "pickStorePlaceholder", value: shiftStore },
    { id: "storeFilterManage", placeholderKey: "filterAll", value: manageFilterStore },
    { id: "attMngStoreFilter", placeholderKey: "filterStoreAll", value: attMngStoreFilterValue },
    { id: "attEditStore", placeholderKey: "", value: null },
    { id: "attSumStoreFilter", placeholderKey: "filterStoreAll", value: attSumState.store },
  ];
  pickers.forEach(({ id, placeholderKey, value }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = value === null ? el.value : value;
    el.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholderKey ? t(placeholderKey) : "";
    el.appendChild(ph);
    kioskStores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      el.appendChild(opt);
    });
    el.value = kioskStores.indexOf(cur) >= 0 ? cur : "";
  });
}

function refreshUserPickerOptions() {
  const pickers = [
    { el: document.getElementById("userPickerAttendance"), placeholderKey: "pickPlaceholder", value: attendanceUserId },
    { el: document.getElementById("userPickerShift"), placeholderKey: "pickPlaceholder", value: shiftUserId },
    { el: document.getElementById("userFilterManage"), placeholderKey: "filterAll", value: manageFilterUserId },
  ];
  pickers.forEach(({ el, placeholderKey, value }) => {
    if (!el) return;
    el.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = t(placeholderKey);
    el.appendChild(ph);
    users.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name;
      el.appendChild(opt);
    });
    el.value = value || "";
  });
}

// ============================================================
// Tabs
// ============================================================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.remove("active");
  });
  const panel = document.getElementById("tab-" + tab);
  if (panel) panel.classList.add("active");
  else return;

  if (tab === "attendance") {
    if (attendanceUserId) refreshStatus();
    else clearAttendanceUI();
  } else if (tab === "shiftGrid") {
    enterShiftGrid();
  } else if (tab === "shiftRegister") {
    if (calYear === null) {
      const now = new Date();
      calYear = now.getFullYear();
      calMonth = now.getMonth() + 1;
    }
    loadCalendar();
  } else if (tab === "shiftManage") {
    if (!manageWeekStart) manageWeekStart = startOfWeekMonday(new Date());
    loadManageShifts();
  }
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// ============================================================
// シフト表 (スタッフ×日付の月間グリッド)
// 旧「シフト登録」「シフト管理」タブを統合した画面。
// セルをタップ → モーダルでパターン/カスタム時刻の登録・削除。
// 上部に日別サマリー (人数 / 時間 / 人件費見込) を表示する。
// ============================================================
const sgState = { store: "", year: null, month: null, shifts: [], byUserDate: {} };
let sgModalCtx = { userId: "", date: "" };

function sgYm() {
  return `${sgState.year}-${String(sgState.month).padStart(2, "0")}`;
}

// シフト1件の時間数。終了が開始以前なら深夜跨ぎ (22:00-06:00) とみなす。
function sgShiftHours(s) {
  const [sh, sm] = String(s.startTime).split(":").map(Number);
  const [eh, em] = String(s.endTime).split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

function sgPatternOf(s) {
  return patterns.find(
    (p) => p.startTime === s.startTime && p.endTime === s.endTime
  ) || null;
}

async function enterShiftGrid() {
  if (sgState.year === null) {
    const now = new Date();
    sgState.year = now.getFullYear();
    sgState.month = now.getMonth() + 1;
  }
  document.getElementById("sgMonthInput").value = sgYm();
  const sel = document.getElementById("sgStoreFilter");
  const cur = sel.value || sgState.store;
  sel.innerHTML = '<option value="">' + t("filterStoreAll") + "</option>";
  kioskStores.forEach((s) => {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    sel.appendChild(o);
  });
  sel.value = kioskStores.indexOf(cur) >= 0 ? cur : "";
  sgState.store = sel.value;
  if (!users.length) await loadUsers();
  await loadShiftGrid();
}

async function loadShiftGrid() {
  if (!patterns.length) {
    const pr = await api("getPatterns");
    if (pr && pr.success) patterns = pr.patterns || [];
  }
  const r = await api("listShifts", {
    year: sgState.year,
    month: sgState.month,
    filterStore: sgState.store,
  });
  sgState.shifts = (r && r.shifts) || [];
  sgState.byUserDate = {};
  sgState.shifts.forEach((s) => {
    const key = `${s.userId}|${s.date}`;
    (sgState.byUserDate[key] = sgState.byUserDate[key] || []).push(s);
  });
  renderSgLegend();
  renderShiftGrid();
}

function renderSgLegend() {
  const root = document.getElementById("sgLegend");
  root.innerHTML = "";
  patterns.forEach((p) => {
    const chip = document.createElement("span");
    chip.className = "sg-legend-chip";
    chip.style.background = p.color;
    chip.textContent = `${p.name} ${p.startTime}-${p.endTime}`;
    root.appendChild(chip);
  });
}

function renderShiftGrid() {
  const wrap = document.getElementById("sgGridWrap");
  wrap.innerHTML = "";
  const y = sgState.year, m = sgState.month;
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = todayLocalStr();
  const wkKeys = ["weekdaySun", "weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat"];

  const dateStrs = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dateStrs.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  const weekdayOf = (d) => new Date(y, m - 1, d).getDay();
  const dayCls = (d, ds) =>
    (weekdayOf(d) === 0 ? " sg-sun" : weekdayOf(d) === 6 ? " sg-sat" : "") +
    (ds === today ? " sg-today" : "");

  const table = document.createElement("table");
  table.className = "sg-table";

  // ---- ヘッダー (日付 + 曜日) ----
  const thead = document.createElement("thead");
  const htr = document.createElement("tr");
  const thName = document.createElement("th");
  thName.className = "sg-sticky-col";
  thName.textContent = t("colEmployee");
  htr.appendChild(thName);
  for (let d = 1; d <= daysInMonth; d++) {
    const th = document.createElement("th");
    th.className = "sg-day" + dayCls(d, dateStrs[d - 1]);
    th.innerHTML = `${d}<span class="sg-wd">${t(wkKeys[weekdayOf(d)])}</span>`;
    htr.appendChild(th);
  }
  const thTot = document.createElement("th");
  thTot.className = "sg-total-col";
  thTot.textContent = t("colTotal");
  htr.appendChild(thTot);
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  // ---- 集計 (日別 + 従業員別) ----
  const dayStats = dateStrs.map(() => ({ people: 0, hours: 0, labor: 0 }));
  let grandHours = 0, grandLabor = 0, grandPeopleDays = 0;
  const userRows = users.map((u) => {
    let uHours = 0, uDays = 0;
    const cells = dateStrs.map((ds, i) => {
      const shifts = sgState.byUserDate[`${u.id}|${ds}`] || [];
      if (!shifts.length) return shifts;
      const h = shifts.reduce((a, s) => a + sgShiftHours(s), 0);
      uHours += h;
      uDays += 1;
      const labor = Number(u.dailyRate) > 0
        ? Number(u.dailyRate)
        : h * (Number(u.hourlyRate) || 0);
      dayStats[i].people += 1;
      dayStats[i].hours += h;
      dayStats[i].labor += labor;
      grandHours += h;
      grandLabor += labor;
      grandPeopleDays += 1;
      return shifts;
    });
    return { u, cells, uHours, uDays };
  });

  // ---- サマリー行 ----
  const fmtHoursNum = (v) => String(Math.round(v * 4) / 4);
  const fmtLabor = (v) =>
    v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : Math.round(v).toLocaleString("vi-VN");
  const addSumRow = (label, get, total) => {
    const tr = document.createElement("tr");
    tr.className = "sg-sum-row";
    const td0 = document.createElement("td");
    td0.className = "sg-sticky-col";
    td0.textContent = label;
    tr.appendChild(td0);
    dayStats.forEach((st, i) => {
      const td = document.createElement("td");
      td.className = dateStrs[i] === today ? "sg-today" : "";
      td.textContent = get(st);
      tr.appendChild(td);
    });
    const tdT = document.createElement("td");
    tdT.className = "sg-total-col";
    tdT.textContent = total;
    tr.appendChild(tdT);
    tbody.appendChild(tr);
  };
  addSumRow(t("sgStaffCount"), (s) => (s.people ? s.people : ""), String(grandPeopleDays));
  addSumRow(t("sgHoursRow"), (s) => (s.hours ? fmtHoursNum(s.hours) : ""), fmtHoursNum(grandHours));
  addSumRow(t("sgLaborRow"), (s) => (s.labor ? fmtLabor(s.labor) : ""), fmtLabor(grandLabor));

  // ---- 従業員行 ----
  userRows.forEach(({ u, cells, uHours, uDays }) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    tdName.className = "sg-sticky-col sg-name";
    tdName.textContent = u.name;
    tr.appendChild(tdName);
    cells.forEach((shifts, i) => {
      const td = document.createElement("td");
      td.className = "sg-cell" + dayCls(i + 1, dateStrs[i]);
      shifts.forEach((s) => {
        const p = sgPatternOf(s);
        const chip = document.createElement("div");
        chip.className = "sg-chip" + (p ? " sg-chip-pattern" : "");
        if (p) chip.style.background = p.color;
        chip.textContent = `${s.startTime}-${s.endTime}`;
        td.appendChild(chip);
      });
      td.addEventListener("click", () => openSgModal(u.id, dateStrs[i]));
      tr.appendChild(td);
    });
    const tdTot = document.createElement("td");
    tdTot.className = "sg-total-col";
    tdTot.innerHTML = uDays
      ? `${fmtHoursNum(uHours)}h<span class="sg-wd">${t("unitDaysFmt").replace("{n}", uDays)}</span>`
      : "";
    tr.appendChild(tdTot);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
}

// ---- セル編集モーダル ----
function openSgModal(userId, date) {
  sgModalCtx = { userId, date };
  const u = users.find((x) => String(x.id) === String(userId));
  document.getElementById("sgModalUser").textContent = u ? u.name : "";
  document.getElementById("sgModalDate").textContent = formatShiftDate(date);
  renderSgModalShifts();
  renderSgModalPatterns();
  document.getElementById("sgStart").value = "";
  document.getElementById("sgEnd").value = "";
  document.getElementById("sgModal").classList.remove("hidden");
}

function closeSgModal() {
  document.getElementById("sgModal").classList.add("hidden");
}

function renderSgModalShifts() {
  const root = document.getElementById("sgModalShifts");
  root.innerHTML = "";
  const shifts = sgState.byUserDate[`${sgModalCtx.userId}|${sgModalCtx.date}`] || [];
  shifts.forEach((s) => {
    const row = document.createElement("div");
    row.className = "sg-modal-shift-row";
    const p = sgPatternOf(s);
    const chip = document.createElement("span");
    chip.className = "sg-chip" + (p ? " sg-chip-pattern" : "");
    if (p) chip.style.background = p.color;
    chip.textContent = `${s.startTime}-${s.endTime}` + (p ? ` (${p.name})` : "");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "sg-del-btn";
    del.textContent = t("deleteShiftBtn");
    del.addEventListener("click", async () => {
      if (!confirm(t("deleteConfirm"))) return;
      const r = await api("deleteShift", { shiftId: s.id });
      if (r.success) {
        showToast(t("msgShiftDeleted"), "success");
        await loadShiftGrid();
        renderSgModalShifts();
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });
    row.appendChild(chip);
    row.appendChild(del);
    root.appendChild(row);
  });
}

function renderSgModalPatterns() {
  const root = document.getElementById("sgModalPatterns");
  root.innerHTML = "";
  patterns.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sg-pattern-btn";
    b.innerHTML =
      `<span class="sg-dot" style="background:${p.color}"></span>` +
      `${p.name}<span class="sg-pattern-time">${p.startTime}-${p.endTime}</span>`;
    b.addEventListener("click", () => sgRegister(p.startTime, p.endTime));
    root.appendChild(b);
  });
}

async function sgRegister(startTime, endTime) {
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    showToast(t("msgShiftInvalidTime"), "error");
    return;
  }
  const r = await api("registerShift", {
    userId: sgModalCtx.userId,
    date: sgModalCtx.date,
    startTime,
    endTime,
    note: "",
    store: sgState.store,
  });
  if (r.success) {
    showToast(t("msgShiftRegistered"), "success");
    await loadShiftGrid();
    renderSgModalShifts();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
}

document.getElementById("sgModalClose").addEventListener("click", closeSgModal);
document.getElementById("sgModalCancel").addEventListener("click", closeSgModal);
document.querySelector("#sgModal .modal-backdrop").addEventListener("click", closeSgModal);
document.getElementById("sgAddCustom").addEventListener("click", () => {
  sgRegister(
    document.getElementById("sgStart").value,
    document.getElementById("sgEnd").value
  );
});
document.getElementById("sgStoreFilter").addEventListener("change", (e) => {
  sgState.store = e.target.value;
  setLastStore(e.target.value);
  loadShiftGrid();
});
document.getElementById("sgMonthInput").addEventListener("change", (e) => {
  const v = e.target.value;
  if (!/^\d{4}-\d{2}$/.test(v)) return;
  sgState.year = parseInt(v.slice(0, 4), 10);
  sgState.month = parseInt(v.slice(5, 7), 10);
  loadShiftGrid();
});
document.getElementById("sgPrevMonth").addEventListener("click", () => {
  sgState.month -= 1;
  if (sgState.month < 1) { sgState.month = 12; sgState.year -= 1; }
  document.getElementById("sgMonthInput").value = sgYm();
  loadShiftGrid();
});
document.getElementById("sgNextMonth").addEventListener("click", () => {
  sgState.month += 1;
  if (sgState.month > 12) { sgState.month = 1; sgState.year += 1; }
  document.getElementById("sgMonthInput").value = sgYm();
  loadShiftGrid();
});
document.getElementById("sgThisMonth").addEventListener("click", () => {
  const now = new Date();
  sgState.year = now.getFullYear();
  sgState.month = now.getMonth() + 1;
  document.getElementById("sgMonthInput").value = sgYm();
  loadShiftGrid();
});

// ============================================================
// User registration screen
// ============================================================
// ============================================================
// Hamburger drawer
// ============================================================
function openDrawer() {
  document.getElementById("drawer").classList.remove("hidden");
}

function closeDrawer() {
  document.getElementById("drawer").classList.add("hidden");
}

function setActiveDrawerItem(target) {
  document.querySelectorAll(".drawer-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.target === target);
  });
}

document.getElementById("menuToggleBtn").addEventListener("click", openDrawer);
document.getElementById("drawerClose").addEventListener("click", closeDrawer);
document.querySelector("#drawer .drawer-backdrop").addEventListener("click", closeDrawer);

document.querySelectorAll(".drawer-item").forEach((item) => {
  item.addEventListener("click", () => {
    const target = item.dataset.target;
    if (target === "dashboard") {
      showScreen("dashboardScreen");
    } else if (target === "transaction") {
      showScreen("transactionScreen");
      enterTransactionScreen();
    } else if (target === "master") {
      showScreen("masterScreen");
      enterMasterScreen();
    } else if (target === "storeDashboard") {
      showScreen("dashboardKpiScreen");
      enterDashboardScreen();
    } else if (target === "attendanceManage") {
      showScreen("attendanceManageScreen");
      enterAttendanceManageScreen();
    } else if (target === "attendanceSummary") {
      showScreen("attendanceSummaryScreen");
      enterAttendanceSummaryScreen();
    }
    setActiveDrawerItem(target);
    closeDrawer();
  });
});

document.getElementById("cancelRegisterBtn").addEventListener("click", () => {
  editingUserId = null;
  setRegisterMode(false);
  document.getElementById("registerForm").reset();
  showScreen("masterScreen");
  setActiveDrawerItem("master");
  masterCurrentTab = "user";
  document.querySelectorAll("[data-master-tab]").forEach((b) =>
    b.classList.toggle("active", b.dataset.masterTab === "user")
  );
  document.querySelectorAll(".master-tab-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById("master-tab-user").classList.add("active");
  loadUserMaster();
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const $ = (id) => document.getElementById(id).value.trim();
  const payload = {
    name: $("regName"),
    role: $("regRole") || "employee",
    gender: $("regGender"),
    birthDate: $("regBirthDate"),
    idNumber: $("regIdNumber"),
    phone: $("regPhone"),
    email: $("regEmail").toLowerCase(),
    address: $("regAddress"),
    emergencyContact: $("regEmergencyContact"),
    hireDate: $("regHireDate"),
    bankName: $("regBankName"),
    bankBranch: $("regBankBranch"),
    bankAccount: $("regBankAccount"),
    store: $("regStore"),
    hourlyRate: document.getElementById("regHourlyRate").value || 0,
    dailyRate: document.getElementById("regDailyRate").value || 0,
  };
  if (!payload.name) {
    showToast(t("msgNameRequired"), "error");
    return;
  }

  // editingUserId がセットされていれば既存ユーザーの更新、なければ新規登録
  const wasEdit = !!editingUserId;
  const result = wasEdit
    ? await api("updateUser", { id: editingUserId, ...payload })
    : await api("register", payload);
  if (result.success) {
    showToast(t(wasEdit ? "msgUserUpdated" : "msgRegisterOk"), "success");
    editingUserId = null;
    setRegisterMode(false);
    document.getElementById("registerForm").reset();
    await loadUsers();
    showScreen("masterScreen");
    setActiveDrawerItem("master");
    masterCurrentTab = "user";
    document.querySelectorAll("[data-master-tab]").forEach((b) =>
      b.classList.toggle("active", b.dataset.masterTab === "user")
    );
    document.querySelectorAll(".master-tab-panel").forEach((p) => p.classList.remove("active"));
    document.getElementById("master-tab-user").classList.add("active");
    loadUserMaster();
  } else if (result.code === "EMAIL_EXISTS") {
    showToast(t("msgEmailExists"), "error");
  } else {
    showToast(result.message || t("msgError"), "error");
  }
});

// ============================================================
// Attendance tab
// ============================================================
document.getElementById("storePickerAttendance").addEventListener("change", (e) => {
  attendanceStore = e.target.value;
});

document.getElementById("userPickerAttendance").addEventListener("change", (e) => {
  attendanceUserId = e.target.value;
  // Capture name/role for the selected user so we can send them with each
  // punch — this saves a Users-sheet lookup on the backend.
  const u = users.find((x) => String(x.id) === String(attendanceUserId));
  attendanceUserInfo = u ? { name: u.name || "", role: u.role || "" } : null;
  if (attendanceUserId) {
    refreshStatus();
  } else {
    clearAttendanceUI();
  }
});

function clearAttendanceUI() {
  currentStatus = "out";
  attendanceUserInfo = null;
  updateStatusBadge();
  updateButtons();
  renderLog([]);
}

async function refreshStatus() {
  if (!attendanceUserId) return;
  const result = await api("getStatus", { userId: attendanceUserId });
  if (result.success) {
    currentStatus = result.status;
    renderLog(result.todayLog || []);
    updateStatusBadge();
    updateButtons();
  }
}

function updateStatusBadge() {
  const badge = document.getElementById("statusBadge");
  if (!badge) return;
  const map = {
    out: { cls: "status-out", key: "statusOut" },
    in: { cls: "status-working", key: "statusWorking" },
    break: { cls: "status-break", key: "statusBreak" },
    finished: { cls: "status-finished", key: "statusFinished" },
  };
  const conf = map[currentStatus] || map.out;
  badge.className = "status-badge " + conf.cls;
  badge.textContent = t(conf.key);
}

function updateButtons() {
  const ci = document.getElementById("clockInBtn");
  const co = document.getElementById("clockOutBtn");
  const bs = document.getElementById("breakStartBtn");
  const be = document.getElementById("breakEndBtn");

  // Strict ordering. clock_in is allowed from both "out" (=新規) and
  // "finished" (=前シフト退勤後の再出勤) so split shifts work within a day.
  const noUser = !attendanceUserId;
  ci.disabled = noUser || (currentStatus !== "out" && currentStatus !== "finished");
  co.disabled = noUser || currentStatus !== "in";
  bs.disabled = noUser || currentStatus !== "in";
  be.disabled = noUser || currentStatus !== "break";
}

function renderLog(logs) {
  const ul = document.getElementById("todayLog");
  ul.innerHTML = "";
  if (!logs.length) {
    const li = document.createElement("li");
    li.className = "log-empty";
    li.textContent = t("logEmpty");
    ul.appendChild(li);
    return;
  }
  const typeMap = {
    clock_in: "logClockIn",
    clock_out: "logClockOut",
    break_start: "logBreakStart",
    break_end: "logBreakEnd",
  };
  logs.forEach((log) => {
    const li = document.createElement("li");
    const typeSpan = document.createElement("span");
    typeSpan.className = "log-type " + log.type;
    typeSpan.textContent = t(typeMap[log.type] || log.type);
    const timeSpan = document.createElement("span");
    timeSpan.className = "log-time";
    timeSpan.textContent = formatTime(log.timestamp);
    li.appendChild(typeSpan);
    li.appendChild(timeSpan);
    ul.appendChild(li);
  });
}

function formatTime(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// Derive the status that would result from this action — used for
// optimistic UI updates so the badge/buttons change before the API responds.
function predictNextStatus(curr, type) {
  if (type === "clock_in") return "in";
  if (type === "clock_out") return "finished";
  if (type === "break_start") return "break";
  if (type === "break_end") return "in";
  return curr;
}

async function recordAttendance(type, successKey) {
  if (!attendanceStore) {
    showToast(t("msgPickStoreFirst"), "error");
    return;
  }
  if (!attendanceUserId) {
    showToast(t("msgPickUserFirst"), "error");
    return;
  }

  // ------- Optimistic UI: update state + show feedback immediately -------
  const prevStatus = currentStatus;
  const nextStatus = predictNextStatus(currentStatus, type);
  currentStatus = nextStatus;
  updateStatusBadge();
  // Show success toast immediately — feels instant to the user.
  showToast(t(successKey), "success");

  // Prevent double-taps while the API call is in flight.
  const allBtns = ["clockInBtn", "clockOutBtn", "breakStartBtn", "breakEndBtn"]
    .map((id) => document.getElementById(id));
  allBtns.forEach((b) => { if (b) b.disabled = true; });

  try {
    const result = await api("record", {
      userId: attendanceUserId,
      type,
      // 打刻店舗。この値がそのままその店舗の人件費になる。
      store: attendanceStore,
      // Supply name/role so the backend doesn't need to query the Users sheet.
      name: attendanceUserInfo ? attendanceUserInfo.name : "",
      role: attendanceUserInfo ? attendanceUserInfo.role : "",
    });
    if (result.success) {
      // Reconcile with the backend's authoritative state.
      currentStatus = result.status;
      renderLog(result.todayLog || []);
      updateStatusBadge();
    } else {
      // Revert the optimistic UI change.
      currentStatus = prevStatus;
      updateStatusBadge();
      if (result.code === "INVALID_STATE") {
        showToast(t("msgInvalidAction"), "error");
      } else {
        showToast(result.message || t("msgError"), "error");
      }
    }
  } catch (err) {
    currentStatus = prevStatus;
    updateStatusBadge();
    showToast(t("msgError"), "error");
  } finally {
    // updateButtons() restores the correct state-based disabled set.
    updateButtons();
  }
}

document.getElementById("clockInBtn").addEventListener("click", () =>
  recordAttendance("clock_in", "msgClockedIn")
);
document.getElementById("clockOutBtn").addEventListener("click", () =>
  recordAttendance("clock_out", "msgClockedOut")
);
document.getElementById("breakStartBtn").addEventListener("click", () =>
  recordAttendance("break_start", "msgBreakStart")
);
document.getElementById("breakEndBtn").addEventListener("click", () =>
  recordAttendance("break_end", "msgBreakEnd")
);

// ============================================================
// Live clock
// ============================================================
function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("currentTime").textContent = `${hh}:${mm}:${ss}`;

  const yyyy = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const weekdaysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const weekdaysJa = ["日", "月", "火", "水", "木", "金", "土"];
  const w =
    currentLang === "ja" ? weekdaysJa[now.getDay()] : weekdaysVi[now.getDay()];
  document.getElementById("currentDate").textContent = `${yyyy}/${mo}/${d} (${w})`;
}
setInterval(tickClock, 1000);
tickClock();

// ============================================================
// Shift register tab — calendar
// ============================================================
function todayLocalStr() {
  const d = new Date();
  return formatDateLocal(d);
}

function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

document.getElementById("storePickerShift").addEventListener("change", (e) => {
  shiftStore = e.target.value;
});

document.getElementById("userPickerShift").addEventListener("change", (e) => {
  shiftUserId = e.target.value;
  updateArmedHint();
  loadCalendar();
});

document.getElementById("prevCalMonthBtn").addEventListener("click", () => {
  calMonth -= 1;
  if (calMonth < 1) {
    calMonth = 12;
    calYear -= 1;
  }
  loadCalendar();
});

document.getElementById("nextCalMonthBtn").addEventListener("click", () => {
  calMonth += 1;
  if (calMonth > 12) {
    calMonth = 1;
    calYear += 1;
  }
  loadCalendar();
});

async function loadCalendar() {
  document.getElementById("calMonthLabel").textContent =
    `${calYear}/${String(calMonth).padStart(2, "0")}`;
  calShiftsByDate = {};
  if (shiftUserId) {
    const result = await api("listShifts", {
      year: calYear,
      month: calMonth,
      filterUserId: shiftUserId,
    });
    if (result.success) {
      (result.shifts || []).forEach((s) => {
        if (!calShiftsByDate[s.date]) calShiftsByDate[s.date] = [];
        calShiftsByDate[s.date].push(s);
      });
    }
  }
  renderCalendar();
}

function getPatternColor(patternId) {
  const p = patterns.find((x) => x.id === patternId);
  return p ? p.color : "#6b7280";
}

// Pad to "HH:MM" so a value like "6:00" matches "06:00".
// Sheets sometimes drops the leading zero on legacy time cells, which
// otherwise breaks the strict equality used by findMatchingPattern.
function normalizeTimeStr(t) {
  if (!t) return "";
  const m = String(t).trim().match(/^(\d{1,2}):(\d{1,2})/);
  if (!m) return String(t);
  return m[1].padStart(2, "0") + ":" + m[2].padStart(2, "0");
}

function findMatchingPattern(startTime, endTime) {
  const a = normalizeTimeStr(startTime);
  const b = normalizeTimeStr(endTime);
  return patterns.find(
    (p) => normalizeTimeStr(p.startTime) === a && normalizeTimeStr(p.endTime) === b
  );
}

function renderCalendar() {
  const root = document.getElementById("calendar");
  root.innerHTML = "";

  // Weekday header
  const weekdays = document.createElement("div");
  weekdays.className = "cal-weekdays";
  const wkKeys = ["weekdaySun", "weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat"];
  for (let i = 0; i < 7; i++) {
    const w = document.createElement("div");
    w.className = "cal-weekday";
    if (i === 0) w.classList.add("sun");
    if (i === 6) w.classList.add("sat");
    w.textContent = t(wkKeys[i]);
    weekdays.appendChild(w);
  }
  root.appendChild(weekdays);

  // Days grid
  const grid = document.createElement("div");
  grid.className = "cal-grid";

  const firstDay = new Date(calYear, calMonth - 1, 1);
  const lastDay = new Date(calYear, calMonth, 0);
  const startWeekday = firstDay.getDay(); // 0 = Sun
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((startWeekday + totalDays) / 7) * 7;
  const todayStr = todayLocalStr();

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "cal-day";
    const dayNum = i - startWeekday + 1;

    if (dayNum < 1 || dayNum > totalDays) {
      cell.classList.add("cal-other-month");
      const fillDay = dayNum < 1 ? new Date(calYear, calMonth - 1, dayNum) : new Date(calYear, calMonth, dayNum - totalDays);
      const numEl = document.createElement("div");
      numEl.className = "cal-day-num";
      numEl.textContent = String(fillDay.getDate());
      cell.appendChild(numEl);
    } else {
      const weekday = (startWeekday + dayNum - 1) % 7;
      if (weekday === 0) cell.classList.add("cal-sun");
      if (weekday === 6) cell.classList.add("cal-sat");

      const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      if (dateStr === todayStr) cell.classList.add("cal-today");

      const numEl = document.createElement("div");
      numEl.className = "cal-day-num";
      numEl.textContent = String(dayNum);
      cell.appendChild(numEl);

      const shiftsBox = document.createElement("div");
      shiftsBox.className = "cal-shifts";
      const shifts = calShiftsByDate[dateStr] || [];
      const maxChips = 2;
      shifts.slice(0, maxChips).forEach((s) => {
        const chip = document.createElement("div");
        chip.className = "cal-shift-chip";
        const matched = findMatchingPattern(s.startTime, s.endTime);
        chip.style.background = matched ? matched.color : "#6b7280";

        const startEl = document.createElement("div");
        startEl.className = "cal-shift-time";
        startEl.textContent = normalizeTimeStr(s.startTime);
        const endEl = document.createElement("div");
        endEl.className = "cal-shift-time";
        endEl.textContent = normalizeTimeStr(s.endTime);
        chip.appendChild(startEl);
        chip.appendChild(endEl);

        shiftsBox.appendChild(chip);
      });
      if (shifts.length > maxChips) {
        const more = document.createElement("div");
        more.className = "cal-shift-more";
        more.textContent = `+${shifts.length - maxChips}`;
        shiftsBox.appendChild(more);
      }
      cell.appendChild(shiftsBox);

      cell.addEventListener("click", () => {
        if (armedPatternId) {
          quickToggleShift(dateStr);
        } else {
          openAddShiftModal(dateStr);
        }
      });
    }
    grid.appendChild(cell);
  }
  root.appendChild(grid);
  root.classList.toggle("armed", !!armedPatternId);
}

// ============================================================
// Add shift modal
// ============================================================
function openAddShiftModal(dateStr) {
  if (!shiftUserId) {
    showToast(t("msgPickUserFirst"), "error");
    return;
  }
  modalDate = dateStr;
  modalPatternId = patterns.length ? patterns[0].id : "custom";

  document.getElementById("modalDateLabel").textContent = formatShiftDate(dateStr);
  document.getElementById("modalNote").value = "";
  document.getElementById("modalStartTime").value = "";
  document.getElementById("modalEndTime").value = "";

  // Existing shifts list (with delete)
  const existingBox = document.getElementById("modalExistingShifts");
  existingBox.innerHTML = "";
  const existing = calShiftsByDate[dateStr] || [];
  existing.forEach((s) => {
    const row = document.createElement("div");
    row.className = "modal-existing-item";
    const left = document.createElement("span");
    left.className = "modal-existing-time";
    const matched = findMatchingPattern(s.startTime, s.endTime);
    const ts = `${normalizeTimeStr(s.startTime)} - ${normalizeTimeStr(s.endTime)}`;
    left.textContent = (matched ? matched.name + "  " : "") + ts + (s.note ? `  / ${s.note}` : "");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "modal-existing-del";
    del.textContent = t("deleteShiftBtn");
    del.addEventListener("click", async () => {
      if (!confirm(t("deleteConfirm"))) return;
      const r = await api("deleteShift", { shiftId: s.id });
      if (r.success) {
        showToast(t("msgShiftDeleted"), "success");
        await loadCalendar();
        openAddShiftModal(dateStr); // refresh modal contents
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });
    row.appendChild(left);
    row.appendChild(del);
    existingBox.appendChild(row);
  });

  renderPatternGrid();

  const modal = document.getElementById("addShiftModal");
  modal.classList.remove("hidden");
}

function closeAddShiftModal() {
  document.getElementById("addShiftModal").classList.add("hidden");
}

function renderPatternGrid() {
  const grid = document.getElementById("patternGrid");
  grid.innerHTML = "";
  patterns.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pattern-card" + (p.id === modalPatternId ? " selected" : "");
    btn.style.setProperty("--pat-color", p.color);
    btn.innerHTML = `
      <div class="pattern-card-name">${escapeHtml(p.name)}</div>
      <div class="pattern-card-time">${p.startTime} - ${p.endTime}</div>
    `;
    btn.addEventListener("click", () => {
      modalPatternId = p.id;
      document.getElementById("customTimeRow").classList.add("hidden");
      renderPatternGrid();
    });
    grid.appendChild(btn);
  });
  // Custom option
  const custom = document.createElement("button");
  custom.type = "button";
  custom.className = "pattern-card pattern-custom" + (modalPatternId === "custom" ? " selected" : "");
  custom.innerHTML = `
    <div class="pattern-card-name">${escapeHtml(t("customPattern"))}</div>
    <div class="pattern-card-time">--:-- - --:--</div>
  `;
  custom.addEventListener("click", () => {
    modalPatternId = "custom";
    document.getElementById("customTimeRow").classList.remove("hidden");
    renderPatternGrid();
  });
  grid.appendChild(custom);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

document.getElementById("addShiftClose").addEventListener("click", closeAddShiftModal);
document.getElementById("modalCancelBtn").addEventListener("click", closeAddShiftModal);
document.querySelector("#addShiftModal .modal-backdrop").addEventListener("click", closeAddShiftModal);

document.getElementById("modalSubmitBtn").addEventListener("click", async () => {
  if (!shiftUserId) {
    showToast(t("msgPickUserFirst"), "error");
    return;
  }
  let startTime, endTime;
  if (modalPatternId === "custom") {
    startTime = document.getElementById("modalStartTime").value;
    endTime = document.getElementById("modalEndTime").value;
    if (!startTime || !endTime) return;
    if (endTime <= startTime) {
      showToast(t("msgShiftInvalidTime"), "error");
      return;
    }
  } else {
    const p = patterns.find((x) => x.id === modalPatternId);
    if (!p) return;
    startTime = p.startTime;
    endTime = p.endTime;
  }
  const note = document.getElementById("modalNote").value.trim();

  const result = await api("registerShift", {
    userId: shiftUserId,
    date: modalDate,
    startTime: normalizeTimeStr(startTime),
    endTime: normalizeTimeStr(endTime),
    note,
    store: shiftStore,
  });
  if (result.success) {
    showToast(t("msgShiftRegistered"), "success");
    closeAddShiftModal();
    loadCalendar();
  } else {
    showToast(result.message || t("msgError"), "error");
  }
});

// ============================================================
// Edit patterns modal
// ============================================================
async function loadPatterns() {
  const result = await api("getPatterns");
  if (result.success) {
    patterns = result.patterns || [];
    renderPatternStrip();
    updateArmedHint();
  }
}

// ============================================================
// Pattern strip (tap-and-hold quick entry)
// ============================================================
function renderPatternStrip() {
  const strip = document.getElementById("patternStrip");
  if (!strip) return;
  strip.innerHTML = "";
  patterns.forEach((p) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pattern-strip-chip" + (p.id === armedPatternId ? " armed" : "");
    chip.style.setProperty("--pat-color", p.color);

    const nameEl = document.createElement("div");
    nameEl.className = "pattern-strip-chip-name";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = p.name;
    nameEl.appendChild(nameSpan);

    const timeEl = document.createElement("div");
    timeEl.className = "pattern-strip-chip-time";
    timeEl.textContent = `${p.startTime}-${p.endTime}`;

    chip.appendChild(nameEl);
    chip.appendChild(timeEl);
    chip.addEventListener("click", () => toggleArmedPattern(p.id));
    strip.appendChild(chip);
  });
}

function toggleArmedPattern(patternId) {
  armedPatternId = armedPatternId === patternId ? null : patternId;
  renderPatternStrip();
  updateArmedHint();
  // Re-render calendar so the .armed class on root toggles
  if (currentTab === "shiftRegister") renderCalendar();
}

function updateArmedHint() {
  const hint = document.getElementById("armedHint");
  if (!hint) return;
  if (!shiftUserId) {
    hint.textContent = t("hintNoUser");
    hint.classList.remove("active");
    return;
  }
  if (armedPatternId) {
    const p = patterns.find((x) => x.id === armedPatternId);
    const name = p ? p.name : "";
    hint.textContent = `「${name}」 ${t("hintArmed")}`;
    hint.classList.add("active");
  } else {
    hint.textContent = t("hintIdle");
    hint.classList.remove("active");
  }
}

// Quick add/remove on cell tap when a pattern is armed.
// Toggles: tapping a date with the armed pattern already registered removes it.
async function quickToggleShift(dateStr) {
  if (!shiftUserId) {
    showToast(t("msgPickUserFirst"), "error");
    return;
  }
  const p = patterns.find((x) => x.id === armedPatternId);
  if (!p) return;

  const ps = normalizeTimeStr(p.startTime);
  const pe = normalizeTimeStr(p.endTime);
  const existing = (calShiftsByDate[dateStr] || []).find(
    (s) => normalizeTimeStr(s.startTime) === ps && normalizeTimeStr(s.endTime) === pe
  );

  let result;
  if (existing) {
    result = await api("deleteShift", { shiftId: existing.id });
    if (result.success) showToast(t("msgShiftDeleted"), "success");
  } else {
    result = await api("registerShift", {
      userId: shiftUserId,
      date: dateStr,
      startTime: normalizeTimeStr(p.startTime),
      endTime: normalizeTimeStr(p.endTime),
      note: "",
      store: shiftStore,
    });
    if (result.success) showToast(t("msgShiftRegistered"), "success");
  }
  if (!result.success) {
    showToast(result.message || t("msgError"), "error");
    return;
  }
  await loadCalendar();
}

function openPatternsModal() {
  const form = document.getElementById("patternsForm");
  form.innerHTML = "";
  patterns.forEach((p, idx) => {
    const block = document.createElement("div");
    block.className = "pattern-edit-block";
    block.style.setProperty("--pat-color", p.color);
    block.innerHTML = `
      <h5>${t("patternLabel")} ${idx + 1}</h5>
      <label>${t("patternName")}</label>
      <input type="text" data-pat="name" value="${escapeAttr(p.name)}" />
      <div class="form-row-2">
        <div>
          <label>${t("shiftStart")}</label>
          <input type="time" data-pat="startTime" value="${escapeAttr(p.startTime)}" />
        </div>
        <div>
          <label>${t("shiftEnd")}</label>
          <input type="time" data-pat="endTime" value="${escapeAttr(p.endTime)}" />
        </div>
      </div>
      <div class="color-row">
        <input type="color" data-pat="color" value="${escapeAttr(p.color)}" />
        <label class="muted">${escapeHtml(p.id)}</label>
      </div>
    `;
    form.appendChild(block);
  });
  document.getElementById("patternsModal").classList.remove("hidden");
}

function closePatternsModal() {
  document.getElementById("patternsModal").classList.add("hidden");
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

document.getElementById("editPatternsBtn").addEventListener("click", openPatternsModal);
document.getElementById("patternsClose").addEventListener("click", closePatternsModal);
document.getElementById("patternsCancelBtn").addEventListener("click", closePatternsModal);
document.querySelector("#patternsModal .modal-backdrop").addEventListener("click", closePatternsModal);

document.getElementById("patternsSaveBtn").addEventListener("click", async () => {
  const blocks = document.querySelectorAll("#patternsForm .pattern-edit-block");
  const newPatterns = [];
  blocks.forEach((block, idx) => {
    const name = block.querySelector('[data-pat="name"]').value.trim();
    const startTime = block.querySelector('[data-pat="startTime"]').value;
    const endTime = block.querySelector('[data-pat="endTime"]').value;
    const color = block.querySelector('[data-pat="color"]').value;
    newPatterns.push({
      id: patterns[idx] ? patterns[idx].id : `P${idx + 1}`,
      name,
      startTime,
      endTime,
      color,
    });
  });
  const result = await api("savePatterns", { patterns: newPatterns });
  if (result.success) {
    showToast(t("msgPatternsSaved"), "success");
    await loadPatterns();
    closePatternsModal();
    if (currentTab === "shiftRegister") {
      renderPatternStrip();
      renderCalendar();
    }
  } else {
    showToast(result.message || t("msgError"), "error");
  }
});

// ============================================================
// Shift manage tab — weekly view (Monday start)
// ============================================================
function startOfWeekMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

// Stable per-user color from the user id (HSL hue derived from a hash).
function userColor(userId) {
  const s = String(userId || "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 48%)`;
}

document.getElementById("storeFilterManage").addEventListener("change", (e) => {
  manageFilterStore = e.target.value;
  loadManageShifts();
});

document.getElementById("userFilterManage").addEventListener("change", (e) => {
  manageFilterUserId = e.target.value;
  loadManageShifts();
});

document.getElementById("prevWeekBtn").addEventListener("click", () => {
  manageWeekStart = new Date(manageWeekStart);
  manageWeekStart.setDate(manageWeekStart.getDate() - 7);
  loadManageShifts();
});

document.getElementById("nextWeekBtn").addEventListener("click", () => {
  manageWeekStart = new Date(manageWeekStart);
  manageWeekStart.setDate(manageWeekStart.getDate() + 7);
  loadManageShifts();
});

document.getElementById("thisWeekBtn").addEventListener("click", () => {
  manageWeekStart = startOfWeekMonday(new Date());
  loadManageShifts();
});

async function loadManageShifts() {
  if (!manageWeekStart) manageWeekStart = startOfWeekMonday(new Date());
  const weekEnd = new Date(manageWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fromStr = formatDateLocal(manageWeekStart);
  const toStr = formatDateLocal(weekEnd);

  document.getElementById("currentWeekLabel").textContent =
    `${shortDate(manageWeekStart)} - ${shortDate(weekEnd)}`;

  const result = await api("listShifts", {
    dateFrom: fromStr,
    dateTo: toStr,
    filterUserId: manageFilterUserId,
    filterStore: manageFilterStore,
  });
  const shifts = (result && result.shifts) || [];
  renderWeekGrid(shifts);
  renderUserLegend(shifts);
}

function shortDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${da}`;
}

function renderWeekGrid(shifts) {
  const root = document.getElementById("weekGrid");
  root.innerHTML = "";

  // Group shifts by date and sort by start time within each day.
  const byDate = {};
  shifts.forEach((s) => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });
  Object.values(byDate).forEach((arr) => {
    arr.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));
  });

  const todayStr = todayLocalStr();
  const wkKeys = ["weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat", "weekdaySun"];

  for (let i = 0; i < 7; i++) {
    const day = new Date(manageWeekStart);
    day.setDate(day.getDate() + i);
    const dateStr = formatDateLocal(day);

    const cell = document.createElement("div");
    cell.className = "week-day";
    if (i === 5) cell.classList.add("week-sat");
    if (i === 6) cell.classList.add("week-sun");
    if (dateStr === todayStr) cell.classList.add("week-today");

    const header = document.createElement("div");
    header.className = "week-day-header";
    const wkEl = document.createElement("div");
    wkEl.className = "week-weekday";
    wkEl.textContent = t(wkKeys[i]);
    const dateEl = document.createElement("div");
    dateEl.className = "week-date";
    dateEl.textContent = `${day.getMonth() + 1}/${day.getDate()}`;
    header.appendChild(wkEl);
    header.appendChild(dateEl);
    cell.appendChild(header);

    const dayShifts = byDate[dateStr] || [];
    if (!dayShifts.length) {
      const empty = document.createElement("div");
      empty.className = "week-empty";
      empty.textContent = "—";
      cell.appendChild(empty);
    } else {
      dayShifts.forEach((s) => {
        const chip = document.createElement("div");
        chip.className = "week-shift";
        chip.style.setProperty("--user-color", userColor(s.userId));

        const nameEl = document.createElement("div");
        nameEl.className = "week-shift-name";
        nameEl.textContent = s.userName || "?";

        const timeEl = document.createElement("div");
        timeEl.className = "week-shift-time";
        timeEl.textContent = `${normalizeTimeStr(s.startTime)}-${normalizeTimeStr(s.endTime)}`;

        chip.appendChild(nameEl);
        chip.appendChild(timeEl);

        if (s.note) {
          const noteEl = document.createElement("div");
          noteEl.className = "week-shift-note";
          noteEl.textContent = s.note;
          chip.appendChild(noteEl);
        }

        chip.addEventListener("click", async () => {
          if (!confirm(t("deleteConfirm"))) return;
          const r = await api("deleteShift", { shiftId: s.id });
          if (r.success) {
            showToast(t("msgShiftDeleted"), "success");
            loadManageShifts();
          } else {
            showToast(r.message || t("msgError"), "error");
          }
        });

        cell.appendChild(chip);
      });
    }

    root.appendChild(cell);
  }
}

function renderUserLegend(shifts) {
  const root = document.getElementById("userLegend");
  root.innerHTML = "";
  const seen = {};
  shifts.forEach((s) => {
    if (!seen[s.userId]) seen[s.userId] = s.userName || "?";
  });
  Object.keys(seen).forEach((uid) => {
    const item = document.createElement("span");
    item.className = "legend-item";
    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.background = userColor(uid);
    const name = document.createElement("span");
    name.textContent = seen[uid];
    item.appendChild(dot);
    item.appendChild(name);
    root.appendChild(item);
  });
}

// ============================================================
// Date label helper (used by add-shift modal)
// ============================================================
function formatShiftDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y, m - 1, d);
  const weekdaysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const weekdaysJa = ["日", "月", "火", "水", "木", "金", "土"];
  const w =
    currentLang === "ja" ? weekdaysJa[dt.getDay()] : weekdaysVi[dt.getDay()];
  const slashed = `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
  return `${slashed} (${w})`;
}

// ============================================================
// Transactions: shared helpers
// ============================================================
let txCurrentTab = "purchase";
let txStores = [];
let pettyType = "out"; // active type in petty modal

// Compact đ formatter applied everywhere in the app.
//   < 1,000          → as-is             (e.g. "500 đ")
//   1,000 ≤ x < 1M   → "Xk đ"            (e.g. "20k đ", "1.5k đ")
//   ≥ 1,000,000      → "X.YM đ" / "XM đ" (e.g. "1.5M đ", "25M đ")
function fmtVnd(n) {
  const v = Math.round(Number(n) || 0);
  // 数値を省略せず "1.500.000 VND" のような完全表示にする(ベトナム式は "." 区切り)。
  return v.toLocaleString("vi-VN") + " VND";
}

// Backward-compatible alias — older code paths still call fmtVndCompact.
const fmtVndCompact = fmtVnd;

// Convert ISO-style date strings ("yyyy-MM-dd" / "yyyy-MM") to slash form
// for display ("yyyy/MM/dd" / "yyyy/MM"). Backend keeps the dash form so
// this is purely a display helper.
function fmtDate(s) {
  if (!s) return "";
  return String(s).replace(/-/g, "/");
}

let txVendors = [];
// 過去に登録された商品名 (仕入れ + 小口)。商品名入力のサジェストに使う。
let txProducts = [];

async function loadStores() {
  const [s, v, p] = await Promise.all([
    api("listStores"),
    api("listVendors"),
    api("listProductNames"),
  ]);
  if (s && s.success) txStores = s.stores || [];
  if (v && v.success) txVendors = v.vendors || [];
  if (p && p.success) txProducts = p.products || [];
  refreshStoreOptions();
  refreshVendorOptions();
  refreshProductOptions();
}

function refreshStoreOptions() {
  // Update <datalist> for free-typing inputs
  const dl = document.getElementById("storeOptions");
  if (dl) {
    dl.innerHTML = "";
    txStores.forEach((s) => {
      const o = document.createElement("option");
      o.value = s;
      dl.appendChild(o);
    });
  }
  // Update filter dropdowns — no placeholder, auto-select first store
  ["purchaseStoreFilter", "pettyStoreFilter"].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = "";
    txStores.forEach((s) => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      sel.appendChild(o);
    });
    if (cur && txStores.indexOf(cur) >= 0) {
      sel.value = cur;
    } else if (txStores.length > 0) {
      sel.value = defaultStoreOf(txStores);
    }
  });
}

function refreshVendorOptions() {
  const dl = document.getElementById("vendorOptions");
  if (dl) {
    dl.innerHTML = "";
    txVendors.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      dl.appendChild(o);
    });
  }
  // 一覧の「取引先で絞り込み」。空文字 = 全件。
  ["purchaseVendorFilter", "pettyVendorFilter"].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = t("filterVendorAll");
    sel.appendChild(ph);
    txVendors.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    // 選択中の取引先がマスタから消えていない限り、選択を維持する
    sel.value = cur && txVendors.indexOf(cur) >= 0 ? cur : "";
  });
}

// 仕入れ・小口の商品名入力に紐づく <datalist>。バックエンドが「直近登録順」で
// 返すので、その順序のまま option を並べる (よく使う商品が上に出る)。
function refreshProductOptions() {
  const dl = document.getElementById("productOptions");
  if (!dl) return;
  dl.innerHTML = "";
  txProducts.forEach((name) => {
    const o = document.createElement("option");
    o.value = name;
    dl.appendChild(o);
  });
}

function enterTransactionScreen() {
  loadStores().then(() => {
    if (txCurrentTab === "purchase") loadPurchases();
    else if (txCurrentTab === "petty") loadPettyCash();
    else if (txCurrentTab === "stocktake") loadStocktakeList();
  });

  // Initialize date filters if empty
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const firstDay = `${y}-${m}-01`;
  const lastDay = `${y}-${m}-${String(new Date(y, today.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const dFrom = document.getElementById("purchaseDateFrom");
  const dTo = document.getElementById("purchaseDateTo");
  if (!dFrom.value) dFrom.value = firstDay;
  if (!dTo.value) dTo.value = lastDay;
  const pm = document.getElementById("pettyMonth");
  if (!pm.value) pm.value = `${y}-${m}`;
}

// Tab switching
document.querySelectorAll("[data-tx-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    txCurrentTab = btn.dataset.txTab;
    document.querySelectorAll("[data-tx-tab]").forEach((b) =>
      b.classList.toggle("active", b === btn)
    );
    document.querySelectorAll(".tx-tab-panel").forEach((p) => p.classList.remove("active"));
    document.getElementById("tx-tab-" + txCurrentTab).classList.add("active");
    if (txCurrentTab === "purchase") loadPurchases();
    else if (txCurrentTab === "petty") loadPettyCash();
    else if (txCurrentTab === "stocktake") loadStocktakeList();
  });
});

// ============================================================
// 取引一覧テーブル: 共通ヘルパー
// 仕入れ・小口とも列数が多いため、カードではなく横スクロールする表で出す。
// ============================================================
const TX_PAGE_SIZES = [20, 50, 100, 0]; // 0 = 全件

// セル1個分。value が Node ならそのまま入れ、文字列なら textContent に入れる
// (=常にエスケープされる。innerHTML は使わない)。
function txCell(value, opts = {}) {
  const td = document.createElement("td");
  if (opts.className) td.className = opts.className;
  if (value instanceof Node) td.appendChild(value);
  else {
    const s = value === null || value === undefined ? "" : String(value);
    td.textContent = s;
    // 省略表示される列は、全文をツールチップで読めるようにしておく
    if (opts.title && s) td.title = s;
  }
  return td;
}

function txTag(text, className) {
  const span = document.createElement("span");
  span.className = "tx-card-tag" + (className ? " " + className : "");
  span.textContent = text;
  return span;
}

// headers: [{ label, className }] / rows: 各行の <td> 配列
function buildTxTable(headers, rows) {
  const wrap = document.createElement("div");
  wrap.className = "tx-table-wrap";
  const table = document.createElement("table");
  table.className = "tx-table";

  const thead = document.createElement("thead");
  const htr = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h.label;
    if (h.className) th.className = h.className;
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((cells) => {
    const tr = document.createElement("tr");
    cells.forEach((td) => tr.appendChild(td));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

// 表示するページ番号を組み立てる。先頭・末尾・現在ページ周辺だけを出し、
// 飛ぶところは "…" で省略する (例: 1 2 3 4 5 … 12)。
function txPageNumbers(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out = [1];
  let from = Math.max(2, current - 1);
  let to = Math.min(totalPages - 1, current + 1);
  // 先頭/末尾に寄っているときは反対側を広げて、常に同じ個数を見せる
  if (current <= 3) to = 4;
  if (current >= totalPages - 2) from = totalPages - 3;
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

// state: { page, pageSize } を直接書き換え、onChange で再描画させる。
function buildTxPager(total, state, onChange) {
  const pageSize = state.pageSize || total || 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(state.page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const bar = document.createElement("div");
  bar.className = "tx-pager";

  const info = document.createElement("div");
  info.className = "tx-pager-info";
  info.textContent = t("pagerSummary")
    .replace("{from}", from).replace("{to}", to).replace("{total}", total);
  bar.appendChild(info);

  const pages = document.createElement("div");
  pages.className = "tx-pager-pages";

  const navBtn = (label, targetPage, disabled) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tx-pager-btn";
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener("click", () => { state.page = targetPage; onChange(); });
    return b;
  };
  pages.appendChild(navBtn("‹", page - 1, page <= 1));
  txPageNumbers(page, totalPages).forEach((p) => {
    if (p === "…") {
      const gap = document.createElement("span");
      gap.className = "tx-pager-gap";
      gap.textContent = "…";
      pages.appendChild(gap);
      return;
    }
    const b = navBtn(String(p), p, false);
    if (p === page) b.classList.add("active");
    pages.appendChild(b);
  });
  pages.appendChild(navBtn("›", page + 1, page >= totalPages));

  const sizeSel = document.createElement("select");
  sizeSel.className = "tx-page-size";
  TX_PAGE_SIZES.forEach((n) => {
    const o = document.createElement("option");
    o.value = String(n);
    o.textContent = n === 0 ? t("pagerAll") : t("pagerPerPage").replace("{n}", n);
    sizeSel.appendChild(o);
  });
  sizeSel.value = String(state.pageSize);
  sizeSel.addEventListener("change", () => {
    state.pageSize = parseInt(sizeSel.value, 10);
    state.page = 1;
    onChange();
  });
  pages.appendChild(sizeSel);

  bar.appendChild(pages);
  return bar;
}

// state.page を範囲内に収めたうえで、そのページ分だけ切り出す。
function txPageSlice(rows, state) {
  if (!state.pageSize) { state.page = 1; return rows; }
  const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;
  const start = (state.page - 1) * state.pageSize;
  return rows.slice(start, start + state.pageSize);
}

function txEmptyBox() {
  const div = document.createElement("div");
  div.className = "tx-empty";
  div.textContent = t("txEmpty");
  return div;
}

// 科目キー → 表示ラベル ("cat" + Pascal case で i18n を引く)
function txCategoryLabel(key) {
  const k = String(key || "");
  if (!k) return "";
  const i18nKey = "cat" + k.charAt(0).toUpperCase() + k.slice(1);
  const label = t(i18nKey);
  return label !== i18nKey ? label : k;
}

function txPaymentMethodLabel(key) {
  const k = String(key || "");
  if (!k) return "";
  // snake_case → PascalCase: "transfer_eom" → "TransferEom"
  const camel = k.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  const label = t("pay" + camel);
  return label !== "pay" + camel ? label : k;
}

// ============================================================
// Purchase tab
// ============================================================
document.getElementById("purchaseStoreFilter").addEventListener("change", loadPurchases);
document.getElementById("purchaseDateFrom").addEventListener("change", loadPurchases);
document.getElementById("purchaseDateTo").addEventListener("change", loadPurchases);
// 取引先・登録方法は取得済みデータへの絞り込みなので、再取得せず再描画のみ。
document.getElementById("purchaseVendorFilter").addEventListener("change", () => {
  purchaseTableState.page = 1;
  renderPurchaseList();
});
document.getElementById("purchaseMethodFilter").addEventListener("change", () => {
  purchaseTableState.page = 1;
  renderPurchaseList();
});
document.getElementById("newPurchaseBtn").addEventListener("click", openPurchaseModal);
document.getElementById("purchaseClose").addEventListener("click", closePurchaseModal);
document.getElementById("purchaseCancel").addEventListener("click", closePurchaseModal);
document.querySelector("#purchaseModal .modal-backdrop").addEventListener("click", closePurchaseModal);

// ----- 一括登録: 仕入アイテム行の動的追加/削除/合計 -----
document.getElementById("pAddItem").addEventListener("click", () => addPurchaseItem());

function addPurchaseItem() {
  const tpl = document.getElementById("pItemTemplate");
  const clone = tpl.content.firstElementChild.cloneNode(true);
  // i18n 反映
  applyLanguageTo(clone);
  // 削除ボタン
  clone.querySelector(".batch-item-remove").addEventListener("click", () => removePurchaseItem(clone));
  // 合計再計算トリガー
  ["unitPrice", "quantity", "taxRate"].forEach((f) => {
    const el = clone.querySelector(`[data-field='${f}']`);
    if (el) {
      el.addEventListener("input", recalcPurchaseAmount);
      el.addEventListener("change", recalcPurchaseAmount);
    }
  });
  document.getElementById("pItemsList").appendChild(clone);
  reindexPurchaseItems();
  recalcPurchaseAmount();
}

function removePurchaseItem(row) {
  const list = document.getElementById("pItemsList");
  if (list.children.length <= 1) {
    showToast(t("msgAtLeastOneItem"), "error");
    return;
  }
  row.remove();
  reindexPurchaseItems();
  recalcPurchaseAmount();
}

function reindexPurchaseItems() {
  const list = document.getElementById("pItemsList");
  const items = Array.from(list.children);
  items.forEach((item, idx) => {
    item.querySelector(".batch-item-index").textContent = `#${idx + 1}`;
    const rm = item.querySelector(".batch-item-remove");
    rm.disabled = items.length <= 1;
  });
  // 送信ボタンに件数を表示
  const btn = document.getElementById("pSubmitBtn");
  if (btn) btn.textContent = `${t("registerBtn")} (${items.length})`;
}

function recalcPurchaseAmount() {
  let totalExcl = 0;
  let totalIncl = 0;
  document.querySelectorAll("#pItemsList .batch-item").forEach((item) => {
    const u = parseFloat(item.querySelector("[data-field='unitPrice']").value) || 0;
    const q = parseFloat(item.querySelector("[data-field='quantity']").value) || 0;
    const r = parseFloat(item.querySelector("[data-field='taxRate']").value) || 0;
    const excl = u * q;
    totalExcl += excl;
    totalIncl += excl * (1 + r / 100);
  });
  document.getElementById("pAmountExcl").textContent = fmtVnd(totalExcl);
  document.getElementById("pAmountIncl").textContent = fmtVnd(totalIncl);
}

// 指定要素配下の data-i18n を現在の言語で置換
function applyLanguageTo(root) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = t(key);
    if (val && val !== key) el.textContent = val;
  });
}

// ------------------------------------------------------------
// 最後に選んだ店舗を記憶し、各画面の店舗フィルタの初期値にする。
// 店舗マスタはアルファベット順のため、記憶が無いと「データの無い店舗」が
// 初期選択になってしまう問題への対策。
// ------------------------------------------------------------
function getLastStore() {
  try { return localStorage.getItem("lastStore") || ""; } catch (e) { return ""; }
}
function setLastStore(v) {
  if (!v) return;
  try { localStorage.setItem("lastStore", v); } catch (e) {}
}
// 店舗フィルタの変更を記憶する (各画面共通)
["purchaseStoreFilter", "pettyStoreFilter", "dashStoreFilter", "stocktakeStoreFilter"]
  .forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", (e) => setLastStore(e.target.value));
  });

// 候補リストから初期店舗を決める: 記憶があればそれ、無ければ先頭
function defaultStoreOf(items) {
  const last = getLastStore();
  return last && items.indexOf(last) >= 0 ? last : (items[0] || "");
}

function fillSelectFromMaster(selectId, items, placeholderKey, opts) {
  const noPlaceholder = !!(opts && opts.noPlaceholder);
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = "";
  if (!noPlaceholder) {
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = t(placeholderKey);
    sel.appendChild(ph);
  }
  items.forEach((it) => {
    const o = document.createElement("option");
    o.value = it;
    o.textContent = it;
    sel.appendChild(o);
  });
  // Restore the previous selection if it's still in the list,
  // otherwise auto-select the first store when no placeholder is shown.
  if (cur && items.indexOf(cur) >= 0) {
    sel.value = cur;
  } else if (noPlaceholder && items.length > 0) {
    sel.value = defaultStoreOf(items);
  } else {
    sel.value = "";
  }
}

function openPurchaseModal() {
  if (!txStores.length) {
    showToast(t("msgNoStores"), "error");
    return;
  }
  document.getElementById("purchaseForm").reset();
  // Refill the store/vendor dropdowns from master data
  fillSelectFromMaster("pStore", txStores, "selectStore");
  fillSelectFromMaster("pVendor", txVendors, "selectVendor");

  const today = new Date();
  document.getElementById("pDate").value =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
  // Preselect store from filter if any
  const filterStore = document.getElementById("purchaseStoreFilter").value;
  if (filterStore) document.getElementById("pStore").value = filterStore;
  // Reset items list & start with 1 item
  document.getElementById("pItemsList").innerHTML = "";
  addPurchaseItem();
  document.getElementById("purchaseModal").classList.remove("hidden");
}

function closePurchaseModal() {
  document.getElementById("purchaseModal").classList.add("hidden");
}

function collectPurchaseItems() {
  return Array.from(document.querySelectorAll("#pItemsList .batch-item")).map((row) => ({
    productName: row.querySelector("[data-field='productName']").value.trim(),
    category:    row.querySelector("[data-field='category']").value,
    unitPrice:   row.querySelector("[data-field='unitPrice']").value || 0,
    quantity:    row.querySelector("[data-field='quantity']").value || 0,
    taxRate:     row.querySelector("[data-field='taxRate']").value,
    note:        row.querySelector("[data-field='note']").value.trim(),
  }));
}

document.getElementById("purchaseForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const $ = (id) => document.getElementById(id).value;
  const items = collectPurchaseItems();
  // 必須チェック: 日付・店舗
  if (!$("pDate") || !$("pStore").trim()) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  // 商品名が空のアイテムを除外
  const validItems = items.filter((it) => it.productName);
  if (validItems.length === 0) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  const payload = {
    date: $("pDate"),
    store: $("pStore").trim(),
    vendor: $("pVendor").trim(),
    paymentMethod: $("pPaymentMethod"),
    paymentStatus: $("pPaymentStatus"),
    items: validItems,
  };
  const r = await api("registerPurchaseBatch", payload);
  if (r.success) {
    showToast(`${r.inserted || validItems.length} ${t("msgItemsRegistered")}`, "success");
    closePurchaseModal();
    await loadStores();
    loadPurchases();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

// 取得済みの全件をここに保持し、取引先/登録方法の絞り込みとページングは
// クライアント側で行う (フィルタのたびにAPIを叩かないため)。
let purchaseRows = [];
const purchaseTableState = { page: 1, pageSize: 100 };

async function loadPurchases() {
  const store = document.getElementById("purchaseStoreFilter").value;
  const dateFrom = document.getElementById("purchaseDateFrom").value;
  const dateTo = document.getElementById("purchaseDateTo").value;
  const r = await api("listPurchases", { store, dateFrom, dateTo });
  purchaseRows = (r && r.purchases) || [];
  purchaseTableState.page = 1;
  renderPurchaseList();
}

function filteredPurchases() {
  const vendor = document.getElementById("purchaseVendorFilter").value;
  const method = document.getElementById("purchaseMethodFilter").value;
  return purchaseRows.filter((p) => {
    if (vendor && String(p.vendor || "") !== vendor) return false;
    if (method && String(p.method || "manual") !== method) return false;
    return true;
  });
}

function renderPurchaseList() {
  const root = document.getElementById("purchaseList");
  root.innerHTML = "";

  const all = filteredPurchases();
  if (!all.length) {
    root.appendChild(txEmptyBox());
    return;
  }

  const headers = [
    { label: t("colPurchaseDate"), className: "tx-col-sticky" },
    { label: t("vendor") },
    { label: t("productName") },
    { label: t("specification") },
    { label: t("colProductType") },
    { label: t("colUnitPriceExcl"), className: "tx-num" },
    { label: t("colOrderQty"), className: "tx-num" },
    { label: t("taxRate"), className: "tx-num" },
    { label: t("colAmountExcl"), className: "tx-num" },
    { label: t("paymentMethod") },
    { label: t("paymentStatus") },
    { label: t("colMethod") },
    { label: t("note") },
    { label: t("colDelete") },
  ];

  const rows = txPageSlice(all, purchaseTableState).map((p) => {
    // 一覧の金額は写真に合わせて税別 (単価 × 数量)。税込はCSV・ダッシュボード側。
    const amountExcl = (Number(p.unitPrice) || 0) * (Number(p.quantity) || 0);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "tx-row-delete";
    del.textContent = "×";
    del.title = t("colDelete");
    del.addEventListener("click", async () => {
      if (!confirm(t("txDeleteConfirm"))) return;
      const r = await api("deletePurchase", { id: p.id });
      if (r.success) {
        showToast(t("msgTxDeleted"), "success");
        loadPurchases();
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });

    const method = String(p.method || "manual");
    const methodTag = txTag(
      t(method === "auto" ? "methodAuto" : "methodManual"),
      method === "auto" ? "tx-card-tag-paid" : ""
    );

    return [
      txCell(fmtDate(p.date), { className: "tx-col-sticky" }),
      txCell(p.vendor, { className: "tx-col-wide", title: true }),
      txCell(p.productName, { className: "tx-col-wide", title: true }),
      txCell(p.specification, { title: true }),
      txCell(txCategoryLabel(p.category)),
      txCell(fmtVnd(p.unitPrice), { className: "tx-num" }),
      txCell(p.quantity, { className: "tx-num" }),
      txCell(`${p.taxRate || 0}%`, { className: "tx-num" }),
      txCell(fmtVnd(amountExcl), { className: "tx-num" }),
      txCell(txPaymentMethodLabel(p.paymentMethod)),
      txCell(
        p.paymentStatus
          ? txTag(t(p.paymentStatus === "paid" ? "payStatusPaid" : "payStatusUnpaid"),
                  "tx-card-tag-" + p.paymentStatus)
          : ""
      ),
      txCell(methodTag),
      txCell(p.note, { className: "tx-col-wide", title: true }),
      txCell(del),
    ];
  });

  root.appendChild(buildTxTable(headers, rows));
  root.appendChild(buildTxPager(all.length, purchaseTableState, renderPurchaseList));
}

// ============================================================
// Petty cash tab
// ============================================================
document.getElementById("pettyStoreFilter").addEventListener("change", loadPettyCash);
document.getElementById("pettyMonth").addEventListener("change", loadPettyCash);
// 取引先・入出金区分は取得済みデータへの絞り込みなので、再取得せず再描画のみ。
document.getElementById("pettyVendorFilter").addEventListener("change", () => {
  pettyTableState.page = 1;
  renderPettyList();
});
document.getElementById("pettyTypeFilter").addEventListener("change", () => {
  pettyTableState.page = 1;
  renderPettyList();
});
document.getElementById("newPettyBtn").addEventListener("click", openPettyModal);
document.getElementById("pettyClose").addEventListener("click", closePettyModal);
document.getElementById("pettyCancel").addEventListener("click", closePettyModal);
document.querySelector("#pettyModal .modal-backdrop").addEventListener("click", closePettyModal);

document.querySelectorAll(".type-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    pettyType = btn.dataset.type;
    document.querySelectorAll(".type-toggle-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.type === pettyType)
    );
  });
});

function openPettyModal() {
  if (!txStores.length) {
    showToast(t("msgNoStores"), "error");
    return;
  }
  document.getElementById("pettyForm").reset();
  // Refill store/vendor dropdowns from master
  fillSelectFromMaster("cStore", txStores, "selectStore");
  fillSelectFromMaster("cVendor", txVendors, "selectVendor");

  pettyType = "out";
  document.querySelectorAll(".type-toggle-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.type === "out")
  );
  const today = new Date();
  document.getElementById("cDate").value =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
  const filterStore = document.getElementById("pettyStoreFilter").value;
  if (filterStore) document.getElementById("cStore").value = filterStore;
  // Reset items & start with 1 item
  document.getElementById("cItemsList").innerHTML = "";
  addPettyItem();
  document.getElementById("pettyModal").classList.remove("hidden");
}

function closePettyModal() {
  document.getElementById("pettyModal").classList.add("hidden");
}

// ----- 一括登録: 小口アイテム行 -----
document.getElementById("cAddItem").addEventListener("click", () => addPettyItem());

function addPettyItem() {
  const tpl = document.getElementById("cItemTemplate");
  const clone = tpl.content.firstElementChild.cloneNode(true);
  applyLanguageTo(clone);
  clone.querySelector(".batch-item-remove").addEventListener("click", () => removePettyItem(clone));
  ["unitPrice", "quantity"].forEach((f) => {
    const el = clone.querySelector(`[data-field='${f}']`);
    if (el) {
      el.addEventListener("input", recalcPettyAmount);
      el.addEventListener("change", recalcPettyAmount);
    }
  });
  document.getElementById("cItemsList").appendChild(clone);
  reindexPettyItems();
  recalcPettyAmount();
}

function removePettyItem(row) {
  const list = document.getElementById("cItemsList");
  if (list.children.length <= 1) {
    showToast(t("msgAtLeastOneItem"), "error");
    return;
  }
  row.remove();
  reindexPettyItems();
  recalcPettyAmount();
}

function reindexPettyItems() {
  const list = document.getElementById("cItemsList");
  const items = Array.from(list.children);
  items.forEach((item, idx) => {
    item.querySelector(".batch-item-index").textContent = `#${idx + 1}`;
    item.querySelector(".batch-item-remove").disabled = items.length <= 1;
  });
  const btn = document.getElementById("cSubmitBtn");
  if (btn) btn.textContent = `${t("registerBtn")} (${items.length})`;
}

// 小口の金額は「単価(税込) × 数量」。行ごとの小計と全体合計を同時に更新する。
function recalcPettyAmount() {
  let total = 0;
  document.querySelectorAll("#cItemsList .batch-item").forEach((row) => {
    const u = parseFloat(row.querySelector("[data-field='unitPrice']").value) || 0;
    const q = parseFloat(row.querySelector("[data-field='quantity']").value) || 0;
    const sub = u * q;
    total += sub;
    const cell = row.querySelector(".batch-item-amount-value");
    if (cell) cell.textContent = fmtVnd(sub);
  });
  document.getElementById("cTotalAmount").textContent = fmtVnd(total);
}

function collectPettyItems() {
  return Array.from(document.querySelectorAll("#cItemsList .batch-item")).map((row) => {
    const unitPrice = parseFloat(row.querySelector("[data-field='unitPrice']").value) || 0;
    const quantity = parseFloat(row.querySelector("[data-field='quantity']").value) || 0;
    return {
      category:    row.querySelector("[data-field='category']").value,
      subCategory: row.querySelector("[data-field='subCategory']").value.trim(),
      productName: row.querySelector("[data-field='productName']").value.trim(),
      unitPrice,
      quantity,
      // 金額はバックエンドでも単価×数量で再計算されるが、旧クライアント互換の
      // フォールバックと画面表示の一貫性のためここでも送っておく。
      amount:      unitPrice * quantity,
      taxRate:     row.querySelector("[data-field='taxRate']").value,
      note:        row.querySelector("[data-field='note']").value.trim(),
    };
  });
}

document.getElementById("pettyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const $ = (id) => document.getElementById(id).value;
  const items = collectPettyItems();
  if (!$("cDate") || !$("cStore").trim()) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  // category と amount が両方ある行のみ有効扱い
  const validItems = items.filter((it) => it.category && Number(it.amount) > 0);
  if (validItems.length === 0) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  const payload = {
    date: $("cDate"),
    store: $("cStore").trim(),
    type: pettyType,
    vendor: $("cVendor").trim(),
    taxCode: $("cTaxCode").trim(),
    items: validItems,
  };
  const r = await api("registerPettyCashBatch", payload);
  if (r.success) {
    showToast(`${r.inserted || validItems.length} ${t("msgItemsRegistered")}`, "success");
    closePettyModal();
    await loadStores();
    loadPettyCash();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

// 取得済みの全件を保持し、取引先/区分の絞り込みとページングはクライアント側で行う。
let pettyRows = [];
const pettyTableState = { page: 1, pageSize: 100 };

async function loadPettyCash() {
  const store = document.getElementById("pettyStoreFilter").value;
  const ymVal = document.getElementById("pettyMonth").value; // "yyyy-MM"
  let year = null, month = null;
  if (ymVal && /^\d{4}-\d{2}$/.test(ymVal)) {
    year = parseInt(ymVal.substring(0, 4), 10);
    month = parseInt(ymVal.substring(5, 7), 10);
  }
  const r = await api("listPettyCash", { store, year, month });
  pettyRows = (r && r.items) || [];
  pettyTableState.page = 1;
  renderPettyList();
}

function filteredPetty() {
  const vendor = document.getElementById("pettyVendorFilter").value;
  const type = document.getElementById("pettyTypeFilter").value;
  return pettyRows.filter((it) => {
    if (vendor && String(it.vendor || "") !== vendor) return false;
    if (type && String(it.type || "out") !== type) return false;
    return true;
  });
}

function renderPettyList() {
  const root = document.getElementById("pettyList");
  root.innerHTML = "";

  const all = filteredPetty();

  // 合計は絞り込み後の件数に対して出す (表と数字が食い違わないように)。
  let totalIn = 0, totalOut = 0;
  all.forEach((it) => {
    if (it.type === "in") totalIn += it.amount;
    else totalOut += it.amount;
  });
  document.getElementById("pettyTotalIn").textContent = fmtVnd(totalIn);
  document.getElementById("pettyTotalOut").textContent = fmtVnd(totalOut);

  if (!all.length) {
    root.appendChild(txEmptyBox());
    return;
  }

  const headers = [
    { label: t("date"), className: "tx-col-sticky" },
    { label: t("vendor") },
    { label: t("category") },
    { label: t("subCategory") },
    { label: t("pettyProductName") },
    { label: t("txType") },
    { label: t("colUnitPriceIncl"), className: "tx-num" },
    { label: t("colOrderQty"), className: "tx-num" },
    { label: t("taxRate"), className: "tx-num" },
    { label: t("colAmountIncl"), className: "tx-num" },
    { label: t("taxCode") },
    { label: t("note") },
    { label: t("colDelete") },
  ];

  const rows = txPageSlice(all, pettyTableState).map((it) => {
    const isIn = it.type === "in";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "tx-row-delete";
    del.textContent = "×";
    del.title = t("colDelete");
    del.addEventListener("click", async () => {
      if (!confirm(t("txDeleteConfirm"))) return;
      const r = await api("deletePettyCash", { id: it.id });
      if (r.success) {
        showToast(t("msgTxDeleted"), "success");
        loadPettyCash();
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });

    return [
      txCell(fmtDate(it.date), { className: "tx-col-sticky" }),
      txCell(it.vendor, { className: "tx-col-wide", title: true }),
      txCell(txCategoryLabel(it.category)),
      txCell(it.subCategory, { title: true }),
      txCell(it.productName, { className: "tx-col-wide", title: true }),
      txCell(txTag(t(isIn ? "typeIn" : "typeOut"), isIn ? "type-in" : "type-out")),
      txCell(fmtVnd(it.unitPrice), { className: "tx-num" }),
      txCell(it.quantity, { className: "tx-num" }),
      txCell(`${it.taxRate || 0}%`, { className: "tx-num" }),
      txCell((isIn ? "+" : "-") + fmtVnd(it.amount),
             { className: "tx-num " + (isIn ? "tx-amount-in" : "tx-amount-out") }),
      txCell(it.taxCode, { title: true }),
      txCell(it.note, { className: "tx-col-wide", title: true }),
      txCell(del),
    ];
  });

  root.appendChild(buildTxTable(headers, rows));
  root.appendChild(buildTxPager(all.length, pettyTableState, renderPettyList));
}

// ============================================================
// CSV export (仕入れ / 小口)
// ------------------------------------------------------------
// 出力形式は運用中の「Theo dõi hoá đơn」シートに合わせた 10 列。
// 画面の表示言語に関わらず、中身は常にベトナム語で出力する
// (既存シートに貼り付けて使うため)。
// ============================================================
const CSV_HEADERS = [
  "No.", "Ngày", "Nhà cung cấp", "Danh Mục", "Nội dung đơn hàng",
  "Số tiền TT", "HTTT", "NOTE", "Trạng thái thanh toán", "VAT",
];

// 仕入れの科目 → Danh Mục
const CSV_PURCHASE_CATEGORY = {
  food: "Thực phẩm",
  drink: "Đồ uống",
  consumables: "Vật tư tiêu hao",
  serviceFee: "Phí dịch vụ",
  staffMeal: "Đồ ăn nhân viên",
  equipment: "Vật tư",
  other: "Khác",
};

// 小口の科目 → Danh Mục
const CSV_PETTY_CATEGORY = {
  purchaseFood: "Thực phẩm",
  purchaseDrink: "Đồ uống",
  reserveDeposit: "Nạp quỹ chuẩn bị",
  utilities: "Điện nước",
  communication: "Viễn thông",
  supplies: "Văn phòng phẩm",
  travel: "Đi lại",
  entertainment: "Tiếp khách",
  bankFee: "Phí ngân hàng",
  other: "Khác",
};

// 支払方法 → HTTT。月末振込は買掛 (Công nợ) として出力する。
const CSV_PAYMENT_METHOD = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  transfer_eom: "Công nợ",
  card: "Thẻ",
  momo: "Momo",
  zalopay: "ZaloPay",
  vnpay: "VNPay",
  other: "Khác",
};

const CSV_PAYMENT_STATUS = {
  paid: "Đã thanh toán",
  unpaid: "Chưa thanh toán",
};

// "yyyy-MM-dd" → "dd/MM/yyyy"
function csvDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s || "");
}

function csvVat(taxRate) {
  return Number(taxRate) > 0 ? "Có VAT" : "Không VAT";
}

// RFC4180 準拠のエスケープ。区切り/引用符/改行を含む値のみ引用符で囲む。
function csvEscape(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// 仕入れ1件 → CSV 1行。金額は税込 (単価 × 数量 × (1+税率))。
function purchaseToCsvRow(p) {
  const incl = Math.round(
    (Number(p.unitPrice) || 0) * (Number(p.quantity) || 0) * (1 + (Number(p.taxRate) || 0) / 100)
  );
  const content = p.specification
    ? `${p.productName} (${p.specification})`
    : p.productName || "";
  return {
    date: p.date,
    cells: [
      csvDate(p.date),
      p.vendor || "",
      CSV_PURCHASE_CATEGORY[p.category] || p.category || "",
      content,
      incl,
      CSV_PAYMENT_METHOD[p.paymentMethod] || p.paymentMethod || "",
      p.note || "",
      CSV_PAYMENT_STATUS[p.paymentStatus] || "",
      csvVat(p.taxRate),
    ],
  };
}

// 小口1件 → CSV 1行。小口現金はその場払いなので HTTT は常に現金・支払済。
function pettyToCsvRow(it) {
  const content = it.productName || it.subCategory || "";
  return {
    date: it.date,
    cells: [
      csvDate(it.date),
      it.vendor || "",
      CSV_PETTY_CATEGORY[it.category] || it.category || "",
      content,
      Math.round(Number(it.amount) || 0),
      "Tiền mặt",
      it.note || "",
      "Đã thanh toán",
      csvVat(it.taxRate),
    ],
  };
}

// UTF-8 BOM + CRLF。BOM が無いと Excel がベトナム語を文字化けさせる。
function buildCsv(rows) {
  const lines = [CSV_HEADERS.join(",")];
  rows.forEach((r, i) => {
    lines.push([i + 1, ...r.cells].map(csvEscape).join(","));
  });
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ファイル名に使えるようにストア名を ASCII 化する (ベトナム語の声調記号を除去)。
function csvSlug(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "all";
}

// 出力対象の期間・店舗を、押されたボタンが属するタブのフィルタから決める。
function csvRangeFrom(source) {
  if (source === "petty") {
    const store = document.getElementById("pettyStoreFilter").value;
    const ym = document.getElementById("pettyMonth").value; // "yyyy-MM"
    if (!/^\d{4}-\d{2}$/.test(ym)) return { store, dateFrom: "", dateTo: "" };
    const y = parseInt(ym.slice(0, 4), 10);
    const m = parseInt(ym.slice(5, 7), 10);
    const last = new Date(y, m, 0).getDate();
    return {
      store,
      dateFrom: `${ym}-01`,
      dateTo: `${ym}-${String(last).padStart(2, "0")}`,
    };
  }
  return {
    store: document.getElementById("purchaseStoreFilter").value,
    dateFrom: document.getElementById("purchaseDateFrom").value,
    dateTo: document.getElementById("purchaseDateTo").value,
  };
}

// include: "purchase" | "petty" | "all"
// source : どちらのタブのフィルタを期間として使うか
async function exportTransactionsCsv(include, source) {
  const { store, dateFrom, dateTo } = csvRangeFrom(source);
  const wantPurchase = include === "purchase" || include === "all";
  const wantPetty = include === "petty" || include === "all";

  const [pRes, cRes] = await Promise.all([
    wantPurchase ? api("listPurchases", { store, dateFrom, dateTo }) : null,
    wantPetty ? api("listPettyCash", { store, dateFrom, dateTo }) : null,
  ]);

  const rows = [];
  if (pRes && pRes.success) {
    (pRes.purchases || []).forEach((p) => rows.push(purchaseToCsvRow(p)));
  }
  // 小口の「入金」は支出の伝票ではないので出力対象外。件数はトーストで知らせる。
  let skippedIn = 0;
  if (cRes && cRes.success) {
    (cRes.items || []).forEach((it) => {
      if (it.type === "in") { skippedIn++; return; }
      rows.push(pettyToCsvRow(it));
    });
  }

  if (!rows.length) {
    showToast(t("msgCsvEmpty"), "error");
    return;
  }

  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const kind = include === "all" ? "giao-dich" : include === "petty" ? "quy-tien-mat" : "mua-hang";
  downloadCsv(
    `${kind}_${csvSlug(store)}_${dateFrom || "start"}_${dateTo || "end"}.csv`,
    buildCsv(rows)
  );

  let msg = t("msgCsvExported").replace("{n}", rows.length);
  if (skippedIn > 0) msg += " " + t("msgCsvSkippedIn").replace("{n}", skippedIn);
  showToast(msg, "success");
}

document.getElementById("exportPurchaseCsvBtn")
  .addEventListener("click", () => exportTransactionsCsv("purchase", "purchase"));
document.getElementById("exportAllCsvFromPurchaseBtn")
  .addEventListener("click", () => exportTransactionsCsv("all", "purchase"));
document.getElementById("exportPettyCsvBtn")
  .addEventListener("click", () => exportTransactionsCsv("petty", "petty"));
document.getElementById("exportAllCsvFromPettyBtn")
  .addEventListener("click", () => exportTransactionsCsv("all", "petty"));


// ============================================================
// 勤怠集計 (従業員別 × 店舗別)
// バックエンドの buildAttendanceBreakdown をそのまま表示するので、
// ダッシュボードの人件費と必ず一致する。
// ============================================================
const attSumState = { store: "", year: null, month: null, rows: [], byStore: [], totals: null };

function fmtHours(h) {
  const n = Number(h) || 0;
  const hh = Math.floor(n);
  const mm = Math.round((n - hh) * 60);
  // 59.7分が60分に丸まって "8h60m" になるのを防ぐ
  if (mm === 60) return `${hh + 1}h 0m`;
  return `${hh}h ${mm}m`;
}

function enterAttendanceSummaryScreen() {
  if (attSumState.year === null) {
    const now = new Date();
    attSumState.year = now.getFullYear();
    attSumState.month = now.getMonth() + 1;
  }
  const ym = `${attSumState.year}-${String(attSumState.month).padStart(2, "0")}`;
  document.getElementById("attSumMonth").value = ym;
  refreshStorePickerOptions();
  loadAttendanceSummary();
}

document.getElementById("attSumMonth").addEventListener("change", (e) => {
  const v = e.target.value;
  if (!/^\d{4}-\d{2}$/.test(v)) return;
  attSumState.year = parseInt(v.slice(0, 4), 10);
  attSumState.month = parseInt(v.slice(5, 7), 10);
  loadAttendanceSummary();
});

document.getElementById("attSumStoreFilter").addEventListener("change", (e) => {
  attSumState.store = e.target.value;
  loadAttendanceSummary();
});

async function loadAttendanceSummary() {
  const r = await api("getAttendanceSummary", {
    year: attSumState.year,
    month: attSumState.month,
    store: attSumState.store,
  });
  attSumState.rows = (r && r.rows) || [];
  attSumState.byStore = (r && r.byStore) || [];
  attSumState.totals = (r && r.totals) || { cost: 0, hours: 0, days: 0 };
  renderAttendanceSummary();
}

function renderAttendanceSummary() {
  // ----- 店舗別カード -----
  const cards = document.getElementById("attSumStoreCards");
  cards.innerHTML = "";
  attSumState.byStore.forEach((s) => {
    const card = document.createElement("div");
    card.className = "att-sum-card";

    const name = document.createElement("div");
    name.className = "att-sum-card-store";
    name.textContent = s.store || "—";
    card.appendChild(name);

    const cost = document.createElement("div");
    cost.className = "att-sum-card-cost";
    cost.textContent = fmtVnd(s.cost);
    card.appendChild(cost);

    const meta = document.createElement("div");
    meta.className = "att-sum-card-meta";
    meta.textContent = `${fmtHours(s.hours)} / ` +
      t("unitDaysFmt").replace("{n}", s.days) + " / " +
      t("attSumPeople").replace("{n}", s.people);
    card.appendChild(meta);

    cards.appendChild(card);
  });

  // ----- 明細テーブル -----
  const root = document.getElementById("attSumList");
  root.innerHTML = "";
  if (!attSumState.rows.length) {
    const div = document.createElement("div");
    div.className = "tx-empty";
    div.textContent = t("attSumEmpty");
    root.appendChild(div);
    return;
  }

  // 単価未設定 (時給も日給も0) の従業員は人件費が0円で計上されてしまうため、
  // 気付けるよう警告バナーを出す。
  const noRateNames = [...new Set(
    attSumState.rows.filter((r) => !r.rate).map((r) => r.name)
  )];
  if (noRateNames.length) {
    const warn = document.createElement("div");
    warn.className = "att-norate-banner";
    warn.textContent = t("noRateBanner").replace("{names}", noRateNames.join(", "));
    root.appendChild(warn);
  }

  // 横スクロール無しで人件費まで見えるよう、4列に集約する。
  // 役職・店舗・単価は従業員名の下のサブ行に出す (CSVには全列が出る)。
  // 金額は数値のみ表示し、単位はヘッダーに出す (スマホ幅でも収まるように)
  const headers = [
    { label: t("colEmployee") },
    { label: t("colWorkDays"), className: "tx-num" },
    { label: t("colWorkHours"), className: "tx-num" },
    { label: `${t("colLaborCost")} (VND)`, className: "tx-num" },
  ];
  const fmtCost = (v) => Math.round(Number(v) || 0).toLocaleString("vi-VN");

  const multiStore = new Set(attSumState.rows.map((r) => r.store)).size > 1;

  const rows = attSumState.rows.map((r) => {
    const nameCell = document.createElement("div");
    nameCell.className = "att-sum-emp";

    const nm = document.createElement("div");
    nm.className = "att-sum-emp-name";
    nm.textContent = r.name;
    if (r.isAway) {
      // 所属店舗以外での勤務が一目で分かるようにする
      const badge = txTag(t("awayBadge"), "tx-card-tag-unpaid");
      badge.title = r.homeStore;
      nm.appendChild(document.createTextNode(" "));
      nm.appendChild(badge);
    }
    nameCell.appendChild(nm);

    const roleKey = "position" + (r.role || "").charAt(0).toUpperCase() + (r.role || "").slice(1);
    const roleLbl = t(roleKey) !== roleKey ? t(roleKey) : (r.role || "");
    const rateLabel = (r.rate ? "" : "⚠ ") + `${fmtVnd(r.rate)}/` +
      t(r.rateType === "daily" ? "rateTypeDaily" : "rateTypeHourly");
    const subParts = [roleLbl];
    // 複数店舗が混在するときだけ店舗名を出す (全行同一店舗なら冗長なので省く)
    if (multiStore) subParts.push(r.store || "—");
    subParts.push(rateLabel);
    const sub = document.createElement("div");
    sub.className = "att-sum-emp-sub";
    sub.textContent = subParts.filter(Boolean).join(" · ");
    nameCell.appendChild(sub);

    return [
      txCell(nameCell),
      txCell(r.days, { className: "tx-num" }),
      txCell(fmtHours(r.hours), { className: "tx-num" }),
      txCell(fmtCost(r.cost), { className: "tx-num" }),
    ];
  });

  // 合計行
  const tot = attSumState.totals;
  rows.push([
    txCell(t("attSumTotal")),
    txCell(tot.days, { className: "tx-num" }),
    txCell(fmtHours(tot.hours), { className: "tx-num" }),
    txCell(fmtCost(tot.cost), { className: "tx-num" }),
  ]);

  const table = buildTxTable(headers, rows);
  const lastRow = table.querySelector("tbody tr:last-child");
  if (lastRow) lastRow.className = "att-sum-total-row";
  root.appendChild(table);
}

// 給与計算用のCSV。金額は桁区切り無しの数値で出すのでそのまま集計できる。
document.getElementById("attSumExportBtn").addEventListener("click", () => {
  if (!attSumState.rows.length) {
    showToast(t("msgCsvEmpty"), "error");
    return;
  }
  const header = [
    t("colStore"), t("colEmployee"), t("positionLabel"), t("colHomeStore"),
    t("colWorkDays"), t("colWorkHours"), t("colRate"), t("colRateType"), t("colLaborCost"),
  ];
  const lines = [header.map(csvEscape).join(",")];
  attSumState.rows.forEach((r) => {
    lines.push([
      r.store || "",
      r.name,
      r.role || "",
      r.homeStore || "",
      r.days,
      // 時間は小数(8.5)で出す。表示は 8h30m だが集計しやすさを優先。
      Math.round(r.hours * 100) / 100,
      r.rate,
      r.rateType === "daily" ? t("rateTypeDaily") : t("rateTypeHourly"),
      r.cost,
    ].map(csvEscape).join(","));
  });
  const tot = attSumState.totals;
  lines.push(["", "", "", "", tot.days, Math.round(tot.hours * 100) / 100, "", "", tot.cost]
    .map(csvEscape).join(","));

  const ym = `${attSumState.year}-${String(attSumState.month).padStart(2, "0")}`;
  downloadCsv(
    `cham-cong_${csvSlug(attSumState.store)}_${ym}.csv`,
    "\uFEFF" + lines.join("\r\n") + "\r\n"
  );
  showToast(t("msgCsvExported").replace("{n}", attSumState.rows.length), "success");
});

// ============================================================
// Master data: stores + vendors
// ============================================================
let masterCurrentTab = "store";

function enterMasterScreen() {
  if (masterCurrentTab === "store") loadStoreMaster();
  else if (masterCurrentTab === "vendor") loadVendorMaster();
  else if (masterCurrentTab === "user") loadUserMaster();
}

document.querySelectorAll("[data-master-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    masterCurrentTab = btn.dataset.masterTab;
    document.querySelectorAll("[data-master-tab]").forEach((b) =>
      b.classList.toggle("active", b === btn)
    );
    document.querySelectorAll(".master-tab-panel").forEach((p) => p.classList.remove("active"));
    document.getElementById("master-tab-" + masterCurrentTab).classList.add("active");
    if (masterCurrentTab === "store") loadStoreMaster();
    else if (masterCurrentTab === "vendor") loadVendorMaster();
    else if (masterCurrentTab === "user") loadUserMaster();
  });
});

// ----- Store master -----
document.getElementById("newStoreBtn").addEventListener("click", openStoreModal);
document.getElementById("storeModalClose").addEventListener("click", closeStoreModal);
document.getElementById("storeCancel").addEventListener("click", closeStoreModal);
document.querySelector("#storeModal .modal-backdrop").addEventListener("click", closeStoreModal);

function openStoreModal() {
  document.getElementById("storeForm").reset();
  document.getElementById("storeModal").classList.remove("hidden");
}
function closeStoreModal() {
  document.getElementById("storeModal").classList.add("hidden");
}

document.getElementById("storeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const $ = (id) => document.getElementById(id).value.trim();
  const payload = {
    name: $("sName"),
    address: $("sAddress"),
    phone: $("sPhone"),
    note: $("sNote"),
  };
  if (!payload.name) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  const r = await api("registerStore", payload);
  if (r.success) {
    showToast(t("msgMasterRegistered"), "success");
    closeStoreModal();
    loadStoreMaster();
    loadStores(); // refresh autocomplete sources too
  } else if (r.code === "DUPLICATE") {
    showToast(t("msgDuplicate"), "error");
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

async function loadStoreMaster() {
  const r = await api("listStoreMaster");
  renderStoreMasterList((r && r.stores) || []);
}

function renderStoreMasterList(list) {
  const root = document.getElementById("storeMasterList");
  root.innerHTML = "";
  if (!list.length) {
    const div = document.createElement("div");
    div.className = "tx-empty";
    div.textContent = t("masterEmpty");
    root.appendChild(div);
    return;
  }
  list.forEach((s) => {
    const card = document.createElement("div");
    card.className = "master-card";

    const name = document.createElement("div");
    name.className = "master-card-name";
    name.textContent = s.name;
    card.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "master-card-meta";
    appendMasterMeta(meta, t("address"), s.address);
    appendMasterMeta(meta, t("phone"), s.phone);
    appendMasterMeta(meta, t("note"), s.note);
    card.appendChild(meta);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "tx-card-delete";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      if (!confirm(t("masterDeleteConfirm"))) return;
      const r = await api("deleteStore", { id: s.id });
      if (r.success) {
        showToast(t("msgMasterDeleted"), "success");
        loadStoreMaster();
        loadStores();
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });
    card.appendChild(del);

    root.appendChild(card);
  });
}

function appendMasterMeta(parent, label, value) {
  if (!value) return;
  const row = document.createElement("div");
  row.className = "master-card-meta-row";
  const lab = document.createElement("span");
  lab.className = "master-card-meta-label";
  lab.textContent = label;
  const val = document.createElement("span");
  val.className = "master-card-meta-value";
  val.textContent = value;
  row.appendChild(lab);
  row.appendChild(val);
  parent.appendChild(row);
}

// ----- Vendor master -----
document.getElementById("newVendorBtn").addEventListener("click", openVendorModal);
document.getElementById("vendorModalClose").addEventListener("click", closeVendorModal);
document.getElementById("vendorCancel").addEventListener("click", closeVendorModal);
document.querySelector("#vendorModal .modal-backdrop").addEventListener("click", closeVendorModal);

function openVendorModal() {
  document.getElementById("vendorForm").reset();
  document.getElementById("vendorModal").classList.remove("hidden");
}
function closeVendorModal() {
  document.getElementById("vendorModal").classList.add("hidden");
}

document.getElementById("vendorForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const $ = (id) => document.getElementById(id).value.trim();
  const payload = {
    name: $("vName"),
    taxCode: $("vTaxCode"),
    address: $("vAddress"),
    phone: $("vPhone"),
    note: $("vNote"),
  };
  if (!payload.name) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  const r = await api("registerVendor", payload);
  if (r.success) {
    showToast(t("msgMasterRegistered"), "success");
    closeVendorModal();
    loadVendorMaster();
    loadStores();
  } else if (r.code === "DUPLICATE") {
    showToast(t("msgDuplicate"), "error");
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

async function loadVendorMaster() {
  const r = await api("listVendorMaster");
  renderVendorMasterList((r && r.vendors) || []);
}

function renderVendorMasterList(list) {
  const root = document.getElementById("vendorMasterList");
  root.innerHTML = "";
  if (!list.length) {
    const div = document.createElement("div");
    div.className = "tx-empty";
    div.textContent = t("masterEmpty");
    root.appendChild(div);
    return;
  }
  list.forEach((v) => {
    const card = document.createElement("div");
    card.className = "master-card";

    const name = document.createElement("div");
    name.className = "master-card-name";
    name.textContent = v.name;
    card.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "master-card-meta";
    appendMasterMeta(meta, "MST", v.taxCode);
    appendMasterMeta(meta, t("address"), v.address);
    appendMasterMeta(meta, t("phone"), v.phone);
    appendMasterMeta(meta, t("note"), v.note);
    card.appendChild(meta);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "tx-card-delete";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      if (!confirm(t("masterDeleteConfirm"))) return;
      const r = await api("deleteVendor", { id: v.id });
      if (r.success) {
        showToast(t("msgMasterDeleted"), "success");
        loadVendorMaster();
        loadStores();
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });
    card.appendChild(del);

    root.appendChild(card);
  });
}

// ----- User master -----
// 編集中のユーザーID。null なら新規登録モード。
let editingUserId = null;

// 登録画面を「新規登録 / 編集」モードに切り替える (タイトルと送信ボタンの文言)。
// data-i18n も差し替えるので、編集中に言語を切り替えても表示が保たれる。
function setRegisterMode(editing) {
  const title = document.getElementById("registerScreenTitle");
  const btn = document.getElementById("registerSubmitBtn");
  title.setAttribute("data-i18n", editing ? "editUserTitle" : "registerTitle");
  btn.setAttribute("data-i18n", editing ? "saveBtn" : "registerBtn");
  title.textContent = t(editing ? "editUserTitle" : "registerTitle");
  btn.textContent = t(editing ? "saveBtn" : "registerBtn");
}

function fillRegStoreOptions() {
  return loadStores().then(() => {
    const sel = document.getElementById("regStore");
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value=""></option>';
    txStores.forEach((s) => {
      const o = document.createElement("option");
      o.value = s; o.textContent = s;
      sel.appendChild(o);
    });
    sel.value = cur;
  });
}

document.getElementById("newUserBtn").addEventListener("click", () => {
  // Open the (existing) full user-registration screen as a sub-screen.
  // After register / cancel, the form returns the user back to the master
  // screen with the user tab active (see registerForm submit / cancel below).
  editingUserId = null;
  document.getElementById("registerForm").reset();
  setRegisterMode(false);
  showScreen("registerScreen");
  fillRegStoreOptions();
});

// 既存ユーザーの編集: 全プロフィールを取得して登録フォームに流し込む
async function openUserEdit(id) {
  const r = await api("getUser", { id });
  if (!r.success || !r.user) {
    showToast(r.message || t("msgError"), "error");
    return;
  }
  const u = r.user;
  editingUserId = u.id;
  document.getElementById("registerForm").reset();
  setRegisterMode(true);
  showScreen("registerScreen");
  await fillRegStoreOptions();
  const set = (elId, v) => {
    const el = document.getElementById(elId);
    if (el) el.value = v === null || v === undefined ? "" : v;
  };
  set("regName", u.name);
  set("regRole", u.role || "employee");
  set("regGender", u.gender);
  set("regBirthDate", u.birthDate);
  set("regIdNumber", u.idNumber);
  set("regPhone", u.phone);
  set("regEmail", u.email);
  set("regAddress", u.address);
  set("regEmergencyContact", u.emergencyContact);
  set("regHireDate", u.hireDate);
  set("regBankName", u.bankName);
  set("regBankBranch", u.bankBranch);
  set("regBankAccount", u.bankAccount);
  set("regStore", u.store);
  set("regHourlyRate", u.hourlyRate || "");
  set("regDailyRate", u.dailyRate || "");
}

async function loadUserMaster() {
  const r = await api("listUsers");
  console.log("[listUsers] response:", r);
  renderUserMasterList((r && r.users) || []);
}

function renderUserMasterList(list) {
  const root = document.getElementById("userMasterList");
  root.innerHTML = "";
  if (!list.length) {
    const div = document.createElement("div");
    div.className = "tx-empty";
    div.textContent = t("masterEmpty");
    root.appendChild(div);
    return;
  }
  list.forEach((u) => {
    const card = document.createElement("div");
    card.className = "master-card";

    const name = document.createElement("div");
    name.className = "master-card-name";
    name.textContent = u.name || u.email || u.id || "(no name)";
    card.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "master-card-meta";
    if (u.role) {
      const k = "position" + u.role.charAt(0).toUpperCase() + u.role.slice(1);
      const lbl = t(k);
      appendMasterMeta(meta, t("positionLabel"), lbl !== k ? lbl : u.role);
    }
    if (u.dailyRate) appendMasterMeta(meta, t("dailyRate"), fmtVnd(u.dailyRate) + t("perDaySuffix"));
    if (u.hourlyRate) appendMasterMeta(meta, t("hourlyRate"), fmtVnd(u.hourlyRate) + "/h");
    if (u.hireDate) appendMasterMeta(meta, t("hireDate"), fmtDate(u.hireDate));
    card.appendChild(meta);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "tx-card-edit";
    edit.textContent = "✎";
    edit.title = t("editBtn");
    edit.addEventListener("click", () => openUserEdit(u.id));
    card.appendChild(edit);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "tx-card-delete";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      if (!confirm(t("userDeleteConfirm"))) return;
      const r = await api("deleteUser", { id: u.id });
      if (r.success) {
        showToast(t("msgMasterDeleted"), "success");
        loadUserMaster();
        loadUsers(); // refresh kiosk picker
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });
    card.appendChild(del);

    root.appendChild(card);
  });
}

// ============================================================
// Store dashboard
// ============================================================
let dashStore = "";
let dashDateFrom = null; // "yyyy-MM-dd"
let dashDateTo = null;   // "yyyy-MM-dd"
// 言語切替時に再描画できるよう、最後に表示したデータを保持する
let dashLastData = null;
let dashLastDailyItems = [];

function dashFmtDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Quick preset helpers
function setRangeToThisMonth() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const last = new Date(y, m, 0).getDate();
  dashDateFrom = `${y}-${String(m).padStart(2, "0")}-01`;
  dashDateTo = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  syncRangeInputs();
}

function setRangeToToday() {
  const today = dashFmtDateInput(new Date());
  dashDateFrom = today;
  dashDateTo = today;
  syncRangeInputs();
}

function setRangeToYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = dashFmtDateInput(d);
  dashDateFrom = y;
  dashDateTo = y;
  syncRangeInputs();
}

function syncRangeInputs() {
  const fromEl = document.getElementById("dashDateFrom");
  const toEl = document.getElementById("dashDateTo");
  if (fromEl) fromEl.value = dashDateFrom;
  if (toEl) toEl.value = dashDateTo;
}

function fmtPct(v) {
  return ((v || 0) * 100).toFixed(1) + "%";
}

function pctValueFmt(v) {
  // For 比率 already in percent-numeric form (e.g. 25.8)
  return (Number(v) || 0).toFixed(1) + "%";
}

function enterDashboardScreen() {
  loadStores().then(() => {
    fillSelectFromMaster("dashStoreFilter", txStores, "dashSelectStore", { noPlaceholder: true });
    if (!dashDateFrom || !dashDateTo) setRangeToThisMonth();
    else syncRangeInputs();
    // Sync dashStore with whatever the dropdown ended up selecting
    const filterVal = document.getElementById("dashStoreFilter").value;
    if (filterVal) dashStore = filterVal;
    if (dashStore) {
      reloadDashboard();
    } else {
      renderDashboardEmpty();
      renderDailySalesList([]);
    }
  });
}

document.getElementById("dashStoreFilter").addEventListener("change", (e) => {
  dashStore = e.target.value;
  if (dashStore) reloadDashboard();
  else { renderDashboardEmpty(); renderDailySalesList([]); }
});

function handleRangeChange() {
  const fromEl = document.getElementById("dashDateFrom");
  const toEl = document.getElementById("dashDateTo");
  let from = fromEl.value;
  let to = toEl.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return;
  // Swap if reversed
  if (from > to) { const tmp = from; from = to; to = tmp; fromEl.value = from; toEl.value = to; }
  dashDateFrom = from;
  dashDateTo = to;
  if (dashStore) reloadDashboard();
}

document.getElementById("dashDateFrom").addEventListener("change", handleRangeChange);
document.getElementById("dashDateTo").addEventListener("change", handleRangeChange);

document.getElementById("dashRangeToday").addEventListener("click", () => {
  setRangeToToday();
  if (dashStore) reloadDashboard();
});

document.getElementById("dashRangeYesterday").addEventListener("click", () => {
  setRangeToYesterday();
  if (dashStore) reloadDashboard();
});

document.getElementById("dashRangeThisMonth").addEventListener("click", () => {
  setRangeToThisMonth();
  if (dashStore) reloadDashboard();
});

async function reloadDashboard() {
  if (!dashStore) return;
  if (!dashDateFrom || !dashDateTo) setRangeToThisMonth();
  const params = {
    store: dashStore,
    dateFrom: dashDateFrom,
    dateTo: dashDateTo,
  };
  const [dash, dailyList] = await Promise.all([
    api("getDashboard", params),
    api("listDailySales", params),
  ]);
  dashLastData = (dash && dash.success) ? dash : null;
  dashLastDailyItems = (dailyList && dailyList.items) || [];
  if (dashLastData) renderDashboard(dashLastData);
  renderDailySalesList(dashLastDailyItems);
}

function renderDashboardEmpty() {
  dashLastData = null;
  dashLastDailyItems = [];
  document.getElementById("dashContent").innerHTML =
    `<div class="dash-empty">${t("dashSelectFirst")}</div>`;
}

function renderDashboard(d) {
  const root = document.getElementById("dashContent");
  root.innerHTML = "";

  // Range banner — shows the active date range (only useful when not full month)
  if (d.dateFrom && d.dateTo) {
    const banner = document.createElement("div");
    banner.className = "dash-range-banner";
    const rangeText = (d.dateFrom === d.dateTo)
      ? fmtDate(d.dateFrom)
      : `${fmtDate(d.dateFrom)} 〜 ${fmtDate(d.dateTo)}`;
    const dayInfo = (d.totalRangeDays && d.totalRangeDays > 0)
      ? " " + t("dashRangeDaysFmt")
          .replace("{total}", d.totalRangeDays)
          .replace("{elapsed}", d.elapsedRangeDays)
      : "";
    banner.textContent = `${t("dashRangeLabel")}: ${rangeText}${dayInfo}`;
    root.appendChild(banner);
  }

  // Sales card — 税抜を主表示、税込をサブ表示
  // (税抜の値が0の場合は legacy フィールド d.sales.total/food/drink にフォールバック)
  const salesExclTotal = d.sales.totalExcl || d.sales.total || 0;
  const salesInclTotal = d.sales.totalIncl || 0;
  const salesFoodExcl  = d.sales.foodExcl  || d.sales.food  || 0;
  const salesFoodIncl  = d.sales.foodIncl  || 0;
  const salesDrinkExcl = d.sales.drinkExcl || d.sales.drink || 0;
  const salesDrinkIncl = d.sales.drinkIncl || 0;

  // Total Sales card — 税込・税抜 を2列で大きく表示
  const totalSalesCard = document.createElement("div");
  totalSalesCard.className = "dash-card span-2 dash-total-sales-card";
  totalSalesCard.innerHTML = `
    <div class="dash-card-label">${t("dashTotalSalesLabel")}</div>
    <div class="dash-total-sales-grid">
      <div class="dash-total-sales-cell">
        <div class="dash-total-sales-sublabel">${t("totalSalesIncl")}</div>
        <div class="dash-total-sales-value">${fmtVndCompact(salesInclTotal)}</div>
      </div>
      <div class="dash-total-sales-cell">
        <div class="dash-total-sales-sublabel">${t("totalSalesExcl")}</div>
        <div class="dash-total-sales-value positive">${fmtVndCompact(salesExclTotal)}</div>
      </div>
    </div>
  `;
  root.appendChild(totalSalesCard);
  const salesCard = document.createElement("div");
  salesCard.className = "dash-card span-2";
  salesCard.innerHTML = `
    <div class="dash-card-header">
      <div>
        <div class="dash-card-label">${t("dashSalesLabel")}</div>
        <div class="dash-card-sub">${t("dashSalesSub")}</div>
      </div>
      <div class="dash-card-value-wrap">
        <div class="dash-card-value positive">${fmtVndCompact(salesExclTotal)}</div>
        <span class="dash-card-target">${t("dashSalesInclLabel")} ${fmtVndCompact(salesInclTotal)}</span>
      </div>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashFood")}</span>
      <span class="dash-row-value">
        ${fmtVndCompact(salesFoodExcl)}
        <span class="dash-row-target-label">/ ${t("dashSalesInclLabel")} ${fmtVndCompact(salesFoodIncl)}</span>
      </span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashDrink")}</span>
      <span class="dash-row-value">
        ${fmtVndCompact(salesDrinkExcl)}
        <span class="dash-row-target-label">/ ${t("dashSalesInclLabel")} ${fmtVndCompact(salesDrinkIncl)}</span>
      </span>
    </div>
    ${d.sales.other ? `<div class="dash-row">
      <span class="dash-row-label">${t("otherSales")}</span>
      <span class="dash-row-value">${fmtVndCompact(d.sales.other)}</span>
    </div>` : ""}
    <div class="dash-row">
      <span class="dash-row-label">${t("dashAvgPerCustomer")} / ${t("dashCustomers")}</span>
      <span class="dash-row-value">${fmtVndCompact(d.sales.avgPerCustomer)} / ${d.sales.customers} ${t("unitPeople")}</span>
    </div>
  `;
  root.appendChild(salesCard);

  // Payments card (現金 / QR / クレジットカード)
  const pay = d.payments || { cash: 0, qr: 0, card: 0, total: 0, cashRatio: 0, qrRatio: 0, cardRatio: 0 };
  const paymentsCard = document.createElement("div");
  paymentsCard.className = "dash-card";
  paymentsCard.innerHTML = `
    <div class="dash-card-header">
      <div>
        <div class="dash-card-label">${t("dashPaymentsLabel")}</div>
        <div class="dash-card-sub">${t("dashPaymentsSub")}</div>
      </div>
      <div class="dash-card-value-wrap">
        <div class="dash-card-value">${fmtVndCompact(pay.total)}</div>
      </div>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("paymentCash")}</span>
      <span class="dash-row-value">${fmtVndCompact(pay.cash)} <span class="dash-row-target-label">/ ${pctValueFmt(pay.cashRatio * 100)}</span></span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("paymentQr")}</span>
      <span class="dash-row-value">${fmtVndCompact(pay.qr)} <span class="dash-row-target-label">/ ${pctValueFmt(pay.qrRatio * 100)}</span></span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("paymentCard")}</span>
      <span class="dash-row-value">${fmtVndCompact(pay.card)} <span class="dash-row-target-label">/ ${pctValueFmt(pay.cardRatio * 100)}</span></span>
    </div>
  `;
  root.appendChild(paymentsCard);

  // Other card (割引 / 入金 / 小口使用)
  const oth = d.other || { discount: 0, deposit: 0, pettyCash: 0 };
  const otherCard = document.createElement("div");
  otherCard.className = "dash-card";
  otherCard.innerHTML = `
    <div class="dash-card-header">
      <div>
        <div class="dash-card-label">${t("dashOtherLabel")}</div>
        <div class="dash-card-sub">${t("dashOtherSub")}</div>
      </div>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("discountAmount")}</span>
      <span class="dash-row-value">${fmtVndCompact(oth.discount)}</span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("depositAmount")}</span>
      <span class="dash-row-value">${fmtVndCompact(oth.deposit)}</span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("pettyCashAmount")}</span>
      <span class="dash-row-value">${fmtVndCompact(oth.pettyCash)}</span>
    </div>
  `;
  root.appendChild(otherCard);

  // Achievement card
  const achCard = document.createElement("div");
  achCard.className = "dash-card";
  const todayPctNum = d.achievement.todayPace * 100;
  const monthPctNum = d.achievement.monthlyProgress * 100;
  achCard.innerHTML = `
    <div class="dash-card-header">
      <div>
        <div class="dash-card-label">${t("dashTodayPace")}</div>
      </div>
      <div class="dash-card-value-wrap">
        <div class="dash-card-value ${todayPctNum >= 100 ? "positive" : ""}">${fmtPct(d.achievement.todayPace)}</div>
      </div>
    </div>
    <div class="dash-progress">
      <div class="dash-progress-bar ${todayPctNum >= 100 ? "success" : ""}" style="width:${Math.min(todayPctNum, 100)}%"></div>
    </div>
    <div class="dash-card-sub">${fmtVndCompact(d.sales.total)} / ${fmtVndCompact(d.target.sales * d.todayDay / d.daysInMonth)}</div>

    <div class="dash-card-header" style="margin-top:18px;">
      <div>
        <div class="dash-card-label">${t("dashMonthlyProgress")}</div>
      </div>
      <div class="dash-card-value-wrap">
        <div class="dash-card-value">${fmtPct(d.achievement.monthlyProgress)}</div>
      </div>
    </div>
    <div class="dash-progress">
      <div class="dash-progress-bar" style="width:${Math.min(monthPctNum, 100)}%"></div>
    </div>
    <div class="dash-card-sub">${fmtVndCompact(d.sales.total)} / ${fmtVndCompact(d.target.sales)}</div>
  `;
  root.appendChild(achCard);

  // Cost ratio card
  const costCard = document.createElement("div");
  costCard.className = "dash-card";
  const totalRatioPct = d.cost.totalRatio * 100;
  const foodRatioPct = d.cost.foodRatio * 100;
  const drinkRatioPct = d.cost.drinkRatio * 100;
  const foodCostTargetPct = d.target.foodCostRatio;
  const drinkCostTargetPct = d.target.drinkCostRatio;
  const totalCostTargetPct = (foodCostTargetPct + drinkCostTargetPct) / 2 || 0;
  const costClass = totalRatioPct > totalCostTargetPct && totalCostTargetPct > 0 ? "negative" : "positive";
  costCard.innerHTML = `
    <div class="dash-card-header">
      <div>
        <div class="dash-card-label">${t("dashCostRatio")}</div>
      </div>
      <div class="dash-card-value-wrap">
        <div class="dash-card-value ${costClass}">${pctValueFmt(totalRatioPct)}</div>
        ${totalCostTargetPct > 0 ? `<span class="dash-card-target">${t("dashTarget")} ${pctValueFmt(totalCostTargetPct)}</span>` : ""}
      </div>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashFood")}</span>
      <span>
        <span class="dash-row-value ${foodCostTargetPct > 0 && foodRatioPct > foodCostTargetPct ? "over" : (foodCostTargetPct > 0 ? "under" : "")}">${pctValueFmt(foodRatioPct)}</span>
        ${foodCostTargetPct > 0 ? `<span class="dash-row-target-label">/ ${t("dashTarget")} ${pctValueFmt(foodCostTargetPct)}</span>` : ""}
      </span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashDrink")}</span>
      <span>
        <span class="dash-row-value ${drinkCostTargetPct > 0 && drinkRatioPct > drinkCostTargetPct ? "over" : (drinkCostTargetPct > 0 ? "under" : "")}">${pctValueFmt(drinkRatioPct)}</span>
        ${drinkCostTargetPct > 0 ? `<span class="dash-row-target-label">/ ${t("dashTarget")} ${pctValueFmt(drinkCostTargetPct)}</span>` : ""}
      </span>
    </div>
  `;
  root.appendChild(costCard);

  // Labor card
  const laborCard = document.createElement("div");
  laborCard.className = "dash-card";
  const laborRatioPct = d.labor.ratio * 100;
  const laborTargetPct = d.target.laborCostRatio;
  const laborClass = laborTargetPct > 0 && laborRatioPct > laborTargetPct ? "negative" : "positive";
  const att = d.labor.attendance || { cost: 0, hours: 0, ratio: 0 };
  const other = d.labor.other || { cost: 0, ratio: 0 };
  laborCard.innerHTML = `
    <div class="dash-card-header">
      <div>
        <div class="dash-card-label">${t("dashLaborRatio")}</div>
      </div>
      <div class="dash-card-value-wrap">
        <div class="dash-card-value ${laborClass}">${pctValueFmt(laborRatioPct)}</div>
        ${laborTargetPct > 0 ? `<span class="dash-card-target">${t("dashTarget")} ${pctValueFmt(laborTargetPct)}</span>` : ""}
      </div>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashLaborCost")}</span>
      <span class="dash-row-value">${fmtVndCompact(d.labor.cost)}</span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashAttLabor")}</span>
      <span class="dash-row-value">${fmtVndCompact(att.cost)} (${pctValueFmt(att.ratio * 100)})</span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashOtherLabor")}</span>
      <span>
        <span class="dash-row-value">${fmtVndCompact(other.cost)} (${pctValueFmt(other.ratio * 100)})</span>
        <button type="button" class="dash-row-edit-btn" id="editOtherLaborBtn">${t("editLabel")}</button>
      </span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashTotalHours")}</span>
      <span class="dash-row-value">${(att.hours || 0).toFixed(1)}h</span>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashSalesPerHour")}</span>
      <span class="dash-row-value">${fmtVndCompact(d.labor.salesPerHour || 0)}</span>
    </div>
  `;
  root.appendChild(laborCard);

  const editBtn = document.getElementById("editOtherLaborBtn");
  if (editBtn) editBtn.addEventListener("click", () => openLaborCostModal(other.cost));

  // Profit card
  const profitCard = document.createElement("div");
  profitCard.className = "dash-card";
  profitCard.innerHTML = `
    <div class="dash-card-header">
      <div>
        <div class="dash-card-label">${t("dashProfit")}</div>
      </div>
      <div class="dash-card-value-wrap">
        <div class="dash-card-value">${fmtVndCompact(d.profit.amount)}</div>
      </div>
    </div>
    <div class="dash-row">
      <span class="dash-row-label">${t("dashProfitRatio")}</span>
      <span class="dash-row-value">${fmtPct(d.profit.ratio)}</span>
    </div>
  `;
  root.appendChild(profitCard);
}

function renderDailySalesList(items) {
  const root = document.getElementById("dailySalesList");
  root.innerHTML = "";
  if (!items.length) {
    const div = document.createElement("div");
    div.className = "tx-empty";
    div.textContent = t("txEmpty");
    root.appendChild(div);
    return;
  }
  items.forEach((it) => {
    const exclTotal = it.totalSalesExcl || (it.foodSales + it.drinkSales + it.otherSales);
    const inclTotal = it.totalSalesIncl || 0;
    const card = document.createElement("div");
    card.className = "tx-card";

    const row1 = document.createElement("div");
    row1.className = "tx-card-row1";
    const date = document.createElement("span");
    date.className = "tx-card-date";
    date.textContent = fmtDate(it.date);
    const amt = document.createElement("span");
    amt.className = "tx-card-amount";
    amt.textContent = fmtVndCompact(exclTotal) + (inclTotal ? ` (${t("dashSalesInclLabel")} ${fmtVndCompact(inclTotal)})` : "");
    row1.appendChild(date);
    row1.appendChild(amt);

    const row3 = document.createElement("div");
    row3.className = "tx-card-row3";
    const foodExcl = it.foodSalesExcl || it.foodSales;
    const drinkExcl = it.drinkSalesExcl || it.drinkSales;
    if (foodExcl) {
      const s = document.createElement("span");
      s.textContent = `${t("dashFood")} ${fmtVndCompact(foodExcl)}`;
      row3.appendChild(s);
    }
    if (drinkExcl) {
      const s = document.createElement("span");
      s.textContent = `${t("dashDrink")} ${fmtVndCompact(drinkExcl)}`;
      row3.appendChild(s);
    }
    if (it.otherSales) {
      const s = document.createElement("span");
      s.textContent = `${t("otherSales")} ${fmtVndCompact(it.otherSales)}`;
      row3.appendChild(s);
    }
    if (it.paymentCash) {
      const s = document.createElement("span");
      s.textContent = `💴 ${fmtVndCompact(it.paymentCash)}`;
      row3.appendChild(s);
    }
    if (it.paymentQr) {
      const s = document.createElement("span");
      s.textContent = `📱 ${fmtVndCompact(it.paymentQr)}`;
      row3.appendChild(s);
    }
    if (it.paymentCard) {
      const s = document.createElement("span");
      s.textContent = `💳 ${fmtVndCompact(it.paymentCard)}`;
      row3.appendChild(s);
    }
    if (it.discountAmount) {
      const s = document.createElement("span");
      s.textContent = `${t("discountAmount")} ${fmtVndCompact(it.discountAmount)}`;
      row3.appendChild(s);
    }
    if (it.depositAmount) {
      const s = document.createElement("span");
      s.textContent = `${t("depositAmount")} ${fmtVndCompact(it.depositAmount)}`;
      row3.appendChild(s);
    }
    if (it.pettyCashAmount) {
      const s = document.createElement("span");
      s.textContent = `${t("pettyCashAmount")} ${fmtVndCompact(it.pettyCashAmount)}`;
      row3.appendChild(s);
    }
    if (it.customers) {
      const s = document.createElement("span");
      s.textContent = `${t("customers")}: ${it.customers}`;
      row3.appendChild(s);
    }
    if (it.note) {
      const s = document.createElement("span");
      s.textContent = it.note;
      row3.appendChild(s);
    }

    const actions = document.createElement("div");
    actions.className = "tx-card-actions";
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn btn-ghost btn-sm";
    copyBtn.textContent = "📋 " + t("copyReportBtn");
    copyBtn.addEventListener("click", async () => {
      const text = buildDailySalesReport(it);
      const ok = await copyTextToClipboard(text);
      showToast(ok ? t("msgReportCopied") : t("msgError"), ok ? "success" : "error");
    });
    actions.appendChild(copyBtn);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "tx-card-delete";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      if (!confirm(t("txDeleteConfirm"))) return;
      const r = await api("deleteDailySales", { id: it.id });
      if (r.success) {
        showToast(t("msgTxDeleted"), "success");
        reloadDashboard();
      }
    });

    card.appendChild(row1);
    card.appendChild(row3);
    card.appendChild(actions);
    card.appendChild(del);
    root.appendChild(card);
  });
}

// --- Daily sales modal ---
document.getElementById("newDailySalesBtn").addEventListener("click", openDailySalesModal);
document.getElementById("dailySalesClose").addEventListener("click", closeDailySalesModal);
document.getElementById("dailySalesCancel").addEventListener("click", closeDailySalesModal);
document.querySelector("#dailySalesModal .modal-backdrop").addEventListener("click", closeDailySalesModal);

function openDailySalesModal() {
  if (!txStores.length) {
    showToast(t("msgNoStores"), "error");
    return;
  }
  document.getElementById("dailySalesForm").reset();
  fillSelectFromMaster("dsStore", txStores, "selectStore");
  if (dashStore) document.getElementById("dsStore").value = dashStore;
  const today = new Date();
  document.getElementById("dsDate").value =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  document.getElementById("dailySalesModal").classList.remove("hidden");
}

function closeDailySalesModal() {
  document.getElementById("dailySalesModal").classList.add("hidden");
}

function readDailySalesForm() {
  const $ = (id) => document.getElementById(id).value;
  const num = (id) => Number($(id)) || 0;
  return {
    store: $("dsStore").trim(),
    date: $("dsDate"),
    totalSalesIncl: num("dsTotalSalesIncl"),
    totalSalesExcl: num("dsTotalSalesExcl"),
    foodSalesIncl: num("dsFoodSalesIncl"),
    foodSalesExcl: num("dsFoodSalesExcl"),
    drinkSalesIncl: num("dsDrinkSalesIncl"),
    drinkSalesExcl: num("dsDrinkSalesExcl"),
    paymentCash: num("dsPaymentCash"),
    paymentQr: num("dsPaymentQr"),
    paymentCard: num("dsPaymentCard"),
    discountAmount: num("dsDiscountAmount"),
    depositAmount: num("dsDepositAmount"),
    pettyCashAmount: num("dsPettyCashAmount"),
    customers: num("dsCustomers"),
    note: $("dsNote").trim(),
  };
}

function buildDailySalesReport(p) {
  // 金額はアプリ全体と同じ "1.500.000 VND" 形式 (fmtVnd) に揃える。
  const customers = Number(p.customers) || 0;
  // 客単価 = 各売上 ÷ 来店人数(0除算ガード)
  const inclBase = Number(p.totalSalesIncl) || 0;
  const exclBase = Number(p.totalSalesExcl) || 0;
  const avgIncl = customers > 0 ? Math.round(inclBase / customers) : 0;
  const avgExcl = customers > 0 ? Math.round(exclBase / customers) : 0;
  const lines = [
    t("dsReportTitle"),
    `${t("colStore")}: ${p.store || t("dsReportNoStore")}`,
    `${t("date")}: ${p.date || t("dsReportNoDate")}`,
    "",
    t("dsReportSalesSection"),
    `${t("totalSalesIncl")}: ${fmtVnd(p.totalSalesIncl)}`,
    `${t("totalSalesExcl")}: ${fmtVnd(p.totalSalesExcl)}`,
    `${t("foodSalesIncl")}: ${fmtVnd(p.foodSalesIncl)}`,
    `${t("foodSalesExcl")}: ${fmtVnd(p.foodSalesExcl)}`,
    `${t("drinkSalesIncl")}: ${fmtVnd(p.drinkSalesIncl)}`,
    `${t("drinkSalesExcl")}: ${fmtVnd(p.drinkSalesExcl)}`,
    "",
    t("dsReportPaymentSection"),
    `${t("paymentCash")}: ${fmtVnd(p.paymentCash)}`,
    `${t("paymentQr")}: ${fmtVnd(p.paymentQr)}`,
    `${t("paymentCard")}: ${fmtVnd(p.paymentCard)}`,
    "",
    t("dsReportOtherSection"),
    `${t("discountAmount")}: ${fmtVnd(p.discountAmount)}`,
    `${t("depositAmount")}: ${fmtVnd(p.depositAmount)}`,
    `${t("pettyCashAmount")}: ${fmtVnd(p.pettyCashAmount)}`,
    `${t("customers")}: ${customers.toLocaleString("vi-VN")} ${t("unitPeople")}`,
    `${t("avgPerCustomerIncl")}: ${fmtVnd(avgIncl)}`,
    `${t("avgPerCustomerExcl")}: ${fmtVnd(avgExcl)}`,
  ];
  if (p.note) {
    lines.push("", `${t("note")}: ${p.note}`);
  }
  return lines.join("\n");
}

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through */ }
  // Fallback: textarea + execCommand for non-secure context / older browsers
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

document.getElementById("dailySalesForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = readDailySalesForm();
  if (!payload.store || !payload.date) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  const r = await api("upsertDailySales", payload);
  if (r.success) {
    showToast(t("msgSaved"), "success");
    closeDailySalesModal();
    if (dashStore) reloadDashboard();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

// --- Monthly target modal ---
document.getElementById("newMonthlyTargetBtn").addEventListener("click", openMonthlyTargetModal);
document.getElementById("monthlyTargetClose").addEventListener("click", closeMonthlyTargetModal);
document.getElementById("monthlyTargetCancel").addEventListener("click", closeMonthlyTargetModal);
document.querySelector("#monthlyTargetModal .modal-backdrop").addEventListener("click", closeMonthlyTargetModal);

async function openMonthlyTargetModal() {
  if (!txStores.length) {
    showToast(t("msgNoStores"), "error");
    return;
  }
  document.getElementById("monthlyTargetForm").reset();
  fillSelectFromMaster("mtStore", txStores, "selectStore");
  const ym = dashDateFrom
    ? dashDateFrom.slice(0, 7)
    : (function () {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
      })();
  document.getElementById("mtYearMonth").value = ym;
  if (dashStore) {
    document.getElementById("mtStore").value = dashStore;
    // Pre-fill existing target if any
    const r = await api("getMonthlyTarget", { store: dashStore, yearMonth: ym });
    if (r && r.success && r.target) {
      const tgt = r.target;
      const setVal = (id, v) => { document.getElementById(id).value = v || ""; };
      setVal("mtFoodTarget", tgt.foodSalesTarget);
      setVal("mtDrinkTarget", tgt.drinkSalesTarget);
      setVal("mtOtherTarget", tgt.otherSalesTarget);
      setVal("mtFoodCostRatio", tgt.foodCostRatioTarget);
      setVal("mtDrinkCostRatio", tgt.drinkCostRatioTarget);
      setVal("mtLaborRatio", tgt.laborCostRatioTarget);
      setVal("mtNote", tgt.note);
    }
  }
  document.getElementById("monthlyTargetModal").classList.remove("hidden");
}

function closeMonthlyTargetModal() {
  document.getElementById("monthlyTargetModal").classList.add("hidden");
}

document.getElementById("monthlyTargetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const $ = (id) => document.getElementById(id).value;
  const payload = {
    store: $("mtStore").trim(),
    yearMonth: $("mtYearMonth"),
    foodSalesTarget: $("mtFoodTarget") || 0,
    drinkSalesTarget: $("mtDrinkTarget") || 0,
    otherSalesTarget: $("mtOtherTarget") || 0,
    foodCostRatioTarget: $("mtFoodCostRatio") || 0,
    drinkCostRatioTarget: $("mtDrinkCostRatio") || 0,
    laborCostRatioTarget: $("mtLaborRatio") || 0,
    note: $("mtNote").trim(),
  };
  if (!payload.store || !payload.yearMonth) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  const r = await api("upsertMonthlyTarget", payload);
  if (r.success) {
    showToast(t("msgSaved"), "success");
    closeMonthlyTargetModal();
    if (dashStore) reloadDashboard();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

// --- Other labor cost edit modal ---
document.getElementById("laborCostClose").addEventListener("click", closeLaborCostModal);
document.getElementById("laborCostCancel").addEventListener("click", closeLaborCostModal);
document.querySelector("#laborCostModal .modal-backdrop").addEventListener("click", closeLaborCostModal);

function openLaborCostModal(currentValue) {
  if (!dashStore || !dashDateFrom) {
    showToast(t("dashSelectFirst"), "error");
    return;
  }
  const ym = dashDateFrom.slice(0, 7);
  document.getElementById("laborCostContext").textContent = `${dashStore} / ${ym}`;
  document.getElementById("lcAmount").value = currentValue || "";
  document.getElementById("laborCostModal").classList.remove("hidden");
}

function closeLaborCostModal() {
  document.getElementById("laborCostModal").classList.add("hidden");
}

document.getElementById("laborCostForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("lcAmount").value || 0;
  const ym = dashDateFrom.slice(0, 7);
  const r = await api("updateMonthlyLaborCost", {
    store: dashStore,
    yearMonth: ym,
    monthlyLaborCost: amount,
  });
  if (r.success) {
    showToast(t("msgSaved"), "success");
    closeLaborCostModal();
    reloadDashboard();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

// ============================================================
// Stocktake (棚卸)
// ============================================================
let stkStore = "";
let stkYear = null;
let stkMonth = null;
let stkLocations = [];
let stkSummary = null;
let stkEditorLocation = null; // active location name when editor view is open
let stkEntries = [];

function getStkYearMonthStr() {
  return `${stkYear}-${String(stkMonth).padStart(2, "0")}`;
}

function setStkMonthInput() {
  document.getElementById("stocktakeMonth").value = getStkYearMonthStr();
}

async function loadStocktakeList() {
  // Initialize defaults
  if (stkYear === null) {
    const now = new Date();
    stkYear = now.getFullYear();
    stkMonth = now.getMonth() + 1;
  }
  setStkMonthInput();

  // Refresh store dropdown — no placeholder, auto-select first store
  const sel = document.getElementById("stocktakeStoreFilter");
  const cur = sel.value || stkStore;
  sel.innerHTML = "";
  txStores.forEach((s) => {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    sel.appendChild(o);
  });
  if (cur && txStores.indexOf(cur) >= 0) {
    sel.value = cur;
    stkStore = cur;
  } else if (txStores.length > 0) {
    sel.value = defaultStoreOf(txStores);
    stkStore = sel.value;
  } else {
    stkStore = "";
  }

  // Show list view, hide editor
  document.getElementById("stocktakeListView").classList.remove("hidden");
  document.getElementById("stocktakeEditorView").classList.add("hidden");

  if (!stkStore) {
    renderStocktakeListEmpty();
    return;
  }
  await reloadStocktakeSummary();
}

function renderStocktakeListEmpty() {
  document.getElementById("stkProgressLabel").textContent = "0/0";
  document.getElementById("stkProgressBar").style.width = "0%";
  ["stkFoodCurrent", "stkFoodPrev", "stkFoodDiff",
   "stkDrinkCurrent", "stkDrinkPrev", "stkDrinkDiff",
   "stkCurrentTotal", "stkPrevTotal", "stkDiffTotal"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = fmtVnd(0);
      el.classList.remove("up", "down");
    }
  });
  const root = document.getElementById("locationList");
  root.innerHTML = `<div class="tx-empty">${t("dashSelectFirst")}</div>`;
}

async function reloadStocktakeSummary() {
  const r = await api("listStocktakeSummary", {
    store: stkStore, year: stkYear, month: stkMonth,
  });
  if (!r || !r.success) return;
  stkSummary = r;
  stkLocations = r.summary || [];

  // Update header summary
  document.getElementById("stkProgressLabel").textContent =
    `${r.completedCount} / ${r.locationCount}`;
  const pct = r.locationCount > 0 ? (r.completedCount / r.locationCount) * 100 : 0;
  document.getElementById("stkProgressBar").style.width = `${Math.min(pct, 100)}%`;
  setStkTableRow("stkFood", r.currentFoodTotal || 0, r.prevFoodTotal || 0);
  setStkTableRow("stkDrink", r.currentDrinkTotal || 0, r.prevDrinkTotal || 0);
  setStkTableRow("stk", r.currentTotal || 0, r.prevTotal || 0); // stkCurrentTotal/stkPrevTotal/stkDiffTotal

  renderLocationList(stkLocations);
}

function setStkTableRow(idPrefix, currentVal, prevVal) {
  // Maps:
  //   stkFood  -> stkFoodCurrent / stkFoodPrev / stkFoodDiff
  //   stkDrink -> stkDrinkCurrent / stkDrinkPrev / stkDrinkDiff
  //   stk      -> stkCurrentTotal / stkPrevTotal / stkDiffTotal (legacy IDs)
  const ids = idPrefix === "stk"
    ? { cur: "stkCurrentTotal", prev: "stkPrevTotal", diff: "stkDiffTotal" }
    : { cur: idPrefix + "Current", prev: idPrefix + "Prev", diff: idPrefix + "Diff" };
  document.getElementById(ids.cur).textContent = fmtVnd(currentVal);
  document.getElementById(ids.prev).textContent = fmtVnd(prevVal);
  const diff = currentVal - prevVal;
  const diffEl = document.getElementById(ids.diff);
  diffEl.textContent = (diff >= 0 ? "+" : "") + fmtVnd(diff);
  diffEl.classList.remove("up", "down");
  if (diff > 0) diffEl.classList.add("up");
  else if (diff < 0) diffEl.classList.add("down");
}

function renderLocationList(locations) {
  const root = document.getElementById("locationList");
  root.innerHTML = "";
  if (!locations.length) {
    root.innerHTML = `<div class="tx-empty">${t("stkNoLocations")}</div>`;
    return;
  }
  locations.forEach((loc) => {
    const card = document.createElement("div");
    card.className = "stk-location-card";
    const status = loc.itemCount > 0 ? "done" : "todo";

    const row1 = document.createElement("div");
    row1.className = "stk-loc-row1";
    const name = document.createElement("span");
    name.className = "stk-loc-name";
    name.textContent = loc.name;
    const amt = document.createElement("span");
    amt.className = "stk-loc-amount" + (loc.itemCount === 0 ? " empty" : "");
    amt.textContent = loc.itemCount > 0 ? fmtVnd(loc.totalAmount) : "—";
    row1.appendChild(name);
    row1.appendChild(amt);

    const row2 = document.createElement("div");
    row2.className = "stk-loc-row2";
    const pill = document.createElement("span");
    pill.className = "stk-loc-status-pill " + status;
    pill.textContent = loc.itemCount > 0 ? t("stkStatusDone") : t("stkStatusTodo");
    row2.appendChild(pill);
    if (loc.itemCount > 0) {
      const cnt = document.createElement("span");
      cnt.textContent = `${loc.itemCount} ${t("stkLocationItems")}`;
      row2.appendChild(cnt);
    }
    if (loc.lastUpdated) {
      const upd = document.createElement("span");
      upd.textContent = `${t("stkUpdated")} ${shortTimestamp(loc.lastUpdated)}`;
      row2.appendChild(upd);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "stk-loc-delete-btn";
    del.textContent = "×";
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(t("stkLocationDeleteConfirm"))) return;
      const r = await api("deleteLocation", { id: loc.locationId });
      if (r.success) reloadStocktakeSummary();
    });

    card.appendChild(row1);
    card.appendChild(row2);
    card.appendChild(del);
    card.addEventListener("click", () => openStocktakeEditor(loc.name));
    root.appendChild(card);
  });
}

function shortTimestamp(iso) {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso;
  return `${m[2]}/${m[3]} ${m[4]}:${m[5]}`;
}

// --- Filter changes ---
document.getElementById("stocktakeStoreFilter").addEventListener("change", (e) => {
  stkStore = e.target.value;
  if (stkStore) reloadStocktakeSummary();
  else renderStocktakeListEmpty();
});

document.getElementById("stocktakeMonth").addEventListener("change", (e) => {
  const v = e.target.value;
  if (/^\d{4}-\d{2}$/.test(v)) {
    stkYear = parseInt(v.slice(0, 4), 10);
    stkMonth = parseInt(v.slice(5, 7), 10);
    if (stkStore) reloadStocktakeSummary();
  }
});

// --- Add location modal ---
document.getElementById("newLocationBtn").addEventListener("click", () => {
  if (!stkStore) {
    showToast(t("msgNoStores"), "error");
    return;
  }
  document.getElementById("locationForm").reset();
  document.getElementById("locationModal").classList.remove("hidden");
});
document.getElementById("locationModalClose").addEventListener("click", closeLocationModal);
document.getElementById("locationCancel").addEventListener("click", closeLocationModal);
document.querySelector("#locationModal .modal-backdrop").addEventListener("click", closeLocationModal);
function closeLocationModal() { document.getElementById("locationModal").classList.add("hidden"); }

document.getElementById("locationForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("locName").value.trim();
  if (!name) return;
  const r = await api("registerLocation", { store: stkStore, name });
  if (r.success) {
    showToast(t("msgSaved"), "success");
    closeLocationModal();
    reloadStocktakeSummary();
  } else if (r.code === "DUPLICATE") {
    showToast(t("msgDuplicate"), "error");
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

// --- Stocktake editor view ---
function openStocktakeEditor(locationName) {
  stkEditorLocation = locationName;
  document.getElementById("stocktakeListView").classList.add("hidden");
  document.getElementById("stocktakeEditorView").classList.remove("hidden");
  document.getElementById("stkEditorLocation").textContent = locationName;
  document.getElementById("stkEditorMonth").textContent = fmtDate(getStkYearMonthStr());
  reloadStocktakeEntries();
}

document.getElementById("stkBackBtn").addEventListener("click", () => {
  stkEditorLocation = null;
  document.getElementById("stocktakeListView").classList.remove("hidden");
  document.getElementById("stocktakeEditorView").classList.add("hidden");
  reloadStocktakeSummary();
});

async function reloadStocktakeEntries() {
  const r = await api("listStocktakeEntries", {
    store: stkStore, location: stkEditorLocation,
    year: stkYear, month: stkMonth,
  });
  stkEntries = (r && r.entries) || [];
  renderStocktakeEntries();
}

function renderStocktakeEntries() {
  const root = document.getElementById("stkEntryList");
  root.innerHTML = "";

  let total = 0;
  let entered = 0;
  stkEntries.forEach((e) => {
    if (e.quantity > 0) entered += 1;
    total += e.amount || 0;
  });
  document.getElementById("stkEditorProgress").textContent = `${entered} / ${stkEntries.length}`;
  document.getElementById("stkEditorTotal").textContent = fmtVnd(total);

  if (!stkEntries.length) {
    root.innerHTML = `<div class="tx-empty">${t("stkNoEntries")}</div>`;
    return;
  }

  stkEntries.forEach((e) => {
    const row = document.createElement("div");
    row.className = "stk-entry-row";

    const name = document.createElement("div");
    name.className = "stk-entry-name";
    name.textContent = e.productName;

    const meta = document.createElement("div");
    meta.className = "stk-entry-meta";
    if (e.category) {
      const tag = document.createElement("span");
      tag.className = "stk-entry-tag " + e.category;
      const catKey = "cat" + e.category.charAt(0).toUpperCase() + e.category.slice(1);
      const catLabel = t(catKey);
      tag.textContent = catLabel !== catKey ? catLabel : e.category;
      meta.appendChild(tag);
    }
    if (e.vendor) {
      const v = document.createElement("span");
      v.textContent = e.vendor;
      meta.appendChild(v);
    }
    if (e.unitPrice) {
      const sp = document.createElement("span");
      sp.textContent = fmtVnd(e.unitPrice);
      meta.appendChild(sp);
    }
    if (e.lastPurchaseDate) {
      const d = document.createElement("span");
      d.textContent = `${t("lastPurchaseLabel")}: ${String(e.lastPurchaseDate).substring(0, 10)}`;
      meta.appendChild(d);
    }

    const inputRow = document.createElement("div");
    inputRow.className = "stk-entry-input-row";

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "0";
    qty.step = "any";
    qty.inputMode = "decimal";
    qty.className = "stk-qty-input";
    qty.value = e.quantity || "";
    qty.placeholder = "0";

    const unit = document.createElement("span");
    unit.className = "stk-entry-unit";
    unit.textContent = e.unit || "";

    const amount = document.createElement("span");
    amount.className = "stk-entry-amount";
    amount.textContent = fmtVnd(e.amount || 0);

    qty.addEventListener("input", () => {
      const q = parseFloat(qty.value) || 0;
      const a = q * (e.unitPrice || 0);
      amount.textContent = fmtVnd(a);
    });
    qty.addEventListener("blur", async () => {
      const q = parseFloat(qty.value) || 0;
      if (q === e.quantity) return; // no change
      const r = await saveStocktakeEntry({ ...e, quantity: q });
      if (r && r.success) {
        e.quantity = q;
        e.amount = q * (e.unitPrice || 0);
        renderStocktakeEntries();
      }
    });

    inputRow.appendChild(qty);
    inputRow.appendChild(unit);
    inputRow.appendChild(amount);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "stk-entry-delete";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      if (!confirm(t("stkEntryDeleteConfirm"))) return;
      const r = await api("deleteStocktakeEntry", { id: e.id });
      if (r.success) reloadStocktakeEntries();
    });

    row.appendChild(name);
    row.appendChild(meta);
    row.appendChild(inputRow);
    row.appendChild(del);
    root.appendChild(row);
  });
}

async function saveStocktakeEntry(entry) {
  return await api("upsertStocktakeEntry", {
    id: entry.id,
    store: stkStore,
    location: stkEditorLocation,
    year: stkYear,
    month: stkMonth,
    itemId: entry.itemId || "",
    category: entry.category || "",
    productName: entry.productName,
    unit: entry.unit || "",
    vendor: entry.vendor || "",
    unitPrice: entry.unitPrice || 0,
    quantity: entry.quantity || 0,
    note: entry.note || "",
  });
}

// --- Copy from previous month ---
document.getElementById("stkCopyPrevBtn").addEventListener("click", async () => {
  const r = await api("copyStocktakeFromPrevMonth", {
    store: stkStore, location: stkEditorLocation,
    year: stkYear, month: stkMonth,
  });
  if (r && r.success) {
    showToast(t("msgCopied").replace("{n}", r.copied || 0), "success");
    reloadStocktakeEntries();
  }
});

// --- Add item modal ---
document.getElementById("stkAddItemBtn").addEventListener("click", openStkAddItemModal);
document.getElementById("stkAddItemClose").addEventListener("click", closeStkAddItemModal);
document.getElementById("stkAddItemCancel").addEventListener("click", closeStkAddItemModal);
document.querySelector("#stkAddItemModal .modal-backdrop").addEventListener("click", closeStkAddItemModal);
document.getElementById("stkItemSearch").addEventListener("input", () => renderInventorySuggestions());

let stkAvailableItems = [];

async function openStkAddItemModal() {
  document.getElementById("stkManualForm").reset();
  document.getElementById("stkItemSearch").value = "";
  document.getElementById("stkAddItemModal").classList.remove("hidden");
  // Load inventory items
  const r = await api("listInventoryItems", { store: stkStore });
  stkAvailableItems = (r && r.items) || [];
  renderInventorySuggestions();
}

function closeStkAddItemModal() {
  document.getElementById("stkAddItemModal").classList.add("hidden");
}

function renderInventorySuggestions() {
  const root = document.getElementById("stkInventoryList");
  root.innerHTML = "";
  const q = document.getElementById("stkItemSearch").value.trim().toLowerCase();
  // Filter out items already in current stocktake
  const existingNames = new Set(stkEntries.map((e) => String(e.productName).toLowerCase()));
  const list = stkAvailableItems.filter((it) => {
    if (existingNames.has(String(it.productName).toLowerCase())) return false;
    if (!q) return true;
    return String(it.productName).toLowerCase().includes(q);
  });

  if (!list.length) {
    root.innerHTML = `<div class="stk-suggestion-empty">${t("stkSuggestionEmpty")}</div>`;
    return;
  }

  list.forEach((it) => {
    const row = document.createElement("div");
    row.className = "stk-suggestion-row";

    // Left column: name + meta (category, vendor)
    const info = document.createElement("div");
    info.className = "stk-suggestion-info";
    const n = document.createElement("div");
    n.className = "stk-suggestion-name";
    n.textContent = it.productName;
    info.appendChild(n);

    const m = document.createElement("div");
    m.className = "stk-suggestion-meta";
    if (it.category) {
      const tag = document.createElement("span");
      tag.className = "stk-entry-tag " + it.category;
      const k = "cat" + it.category.charAt(0).toUpperCase() + it.category.slice(1);
      const cl = t(k);
      tag.textContent = cl !== k ? cl : it.category;
      m.appendChild(tag);
    }
    if (it.lastVendor) {
      const v = document.createElement("span");
      v.textContent = it.lastVendor;
      m.appendChild(v);
    }
    if (it.lastPurchaseDate) {
      const d = document.createElement("span");
      d.textContent = `${t("lastPurchaseLabel")}: ${String(it.lastPurchaseDate).substring(0, 10)}`;
      m.appendChild(d);
    }
    info.appendChild(m);

    // Middle column: unit price (prominent)
    const price = document.createElement("div");
    if (it.lastUnitPrice) {
      price.className = "stk-suggestion-price";
      price.textContent = fmtVnd(it.lastUnitPrice);
    } else {
      price.className = "stk-suggestion-price-empty";
      price.textContent = "—";
    }

    // Right column: add button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stk-suggestion-add";
    btn.textContent = t("addItemBtn");
    btn.addEventListener("click", async () => {
      const r = await saveStocktakeEntry({
        store: stkStore,
        location: stkEditorLocation,
        category: it.category || "",
        productName: it.productName,
        unit: it.unit || "",
        vendor: it.lastVendor || "",
        unitPrice: it.lastUnitPrice || 0,
        quantity: 0,
      });
      if (r && r.success) {
        await reloadStocktakeEntries();
        renderInventorySuggestions();
      }
    });

    row.appendChild(info);
    row.appendChild(price);
    row.appendChild(btn);
    root.appendChild(row);
  });
}

// Manual add form
document.getElementById("stkManualForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("stkManName").value.trim();
  const unit = document.getElementById("stkManUnit").value.trim();
  const category = document.getElementById("stkManCategory").value;
  const unitPrice = parseFloat(document.getElementById("stkManUnitPrice").value) || 0;
  if (!name) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  // Add to inventory master (so it persists for future months)
  await api("registerInventoryItem", {
    store: stkStore, productName: name, unit, category, lastUnitPrice: unitPrice,
  });
  // Add to current stocktake with qty=0
  const r = await saveStocktakeEntry({
    store: stkStore, location: stkEditorLocation, category, productName: name,
    unit, unitPrice, quantity: 0,
  });
  if (r && r.success) {
    document.getElementById("stkManualForm").reset();
    closeStkAddItemModal();
    reloadStocktakeEntries();
  }
});

// ============================================================
// Attendance Management (月間カレンダー表示)
// ============================================================
let attCalState = { userId: "", year: null, month: null, byDate: {} };
let attDayModalDate = "";
// 勤怠管理画面の店舗フィルタ (空 = 全店舗)
let attMngStoreFilterValue = "";

document.getElementById("attMngStoreFilter").addEventListener("change", (e) => {
  attMngStoreFilterValue = e.target.value;
  if (attCalState.userId) loadAttendanceMonth();
});

// 退勤忘れの検出結果をバナーで出す。放置すると人件費が過大になるので
// 勤怠管理画面を開くたびに確認する。
async function refreshUnclosedBanner() {
  const box = document.getElementById("attUnclosedBanner");
  const r = await api("listUnclosedPunches", {});
  const items = (r && r.success && r.items) || [];
  box.innerHTML = "";
  if (!items.length) {
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");

  const title = document.createElement("div");
  title.className = "att-unclosed-title";
  title.textContent = t("attUnclosedTitle");
  box.appendChild(title);

  items.forEach((it) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "att-unclosed-row";
    row.textContent = t("attUnclosedRow")
      .replace("{name}", it.name)
      .replace("{store}", it.store || "—")
      .replace("{at}", `${fmtDate(it.clockInDate)} ${formatTime(it.clockInAt)}`)
      .replace("{hours}", it.elapsedHours);
    // クリックでその人・その日の打刻修正へ直行できるようにする
    row.addEventListener("click", () => {
      attCalState.userId = it.userId;
      document.getElementById("attMngUserFilter").value = it.userId;
      const [y, m] = it.clockInDate.split("-").map(Number);
      attCalState.year = y;
      attCalState.month = m;
      updateAttMonthLabel();
      loadAttendanceMonth().then(() => openAttDayModal(it.clockInDate));
    });
    box.appendChild(row);
  });

  const hint = document.createElement("div");
  hint.className = "att-unclosed-hint";
  hint.textContent = t("attUnclosedHint");
  box.appendChild(hint);
}

function enterAttendanceManageScreen() {
  // ユーザーピッカー初期化(プレースホルダーのみ、必須選択)
  const sel = document.getElementById("attMngUserFilter");
  sel.innerHTML = '<option value="">' + t("pickPlaceholder") + "</option>";
  users.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    sel.appendChild(opt);
  });
  sel.value = attCalState.userId || "";

  // 初回は今月にセット
  if (attCalState.year === null) {
    const now = new Date();
    attCalState.year = now.getFullYear();
    attCalState.month = now.getMonth() + 1;
  }
  updateAttMonthLabel();
  refreshStorePickerOptions();
  refreshUnclosedBanner();
  if (attCalState.userId) loadAttendanceMonth();
  else renderAttendanceCalendarEmpty();
}

function renderAttendanceCalendarEmpty() {
  document.getElementById("attMngCalendar").innerHTML =
    `<div class="tx-empty">${t("attMngPickUserFirst")}</div>`;
  document.getElementById("attMngTotalHours").textContent = "—";
  document.getElementById("attMngTotalDays").textContent = "—";
}

function updateAttMonthLabel() {
  document.getElementById("attMngMonthInput").value =
    `${attCalState.year}-${String(attCalState.month).padStart(2, "0")}`;
}

// 月入力で任意の月へ直接ジャンプできる («/» の月送りと併用)
document.getElementById("attMngMonthInput").addEventListener("change", (e) => {
  const v = e.target.value; // "yyyy-MM"
  if (!/^\d{4}-\d{2}$/.test(v)) return;
  attCalState.year = parseInt(v.slice(0, 4), 10);
  attCalState.month = parseInt(v.slice(5, 7), 10);
  if (attCalState.userId) loadAttendanceMonth();
});

document.getElementById("attMngUserFilter").addEventListener("change", (e) => {
  attCalState.userId = e.target.value;
  if (attCalState.userId) loadAttendanceMonth();
  else renderAttendanceCalendarEmpty();
});

document.getElementById("attMngPrevMonth").addEventListener("click", () => {
  attCalState.month -= 1;
  if (attCalState.month < 1) { attCalState.month = 12; attCalState.year -= 1; }
  updateAttMonthLabel();
  if (attCalState.userId) loadAttendanceMonth();
});

document.getElementById("attMngNextMonth").addEventListener("click", () => {
  attCalState.month += 1;
  if (attCalState.month > 12) { attCalState.month = 1; attCalState.year += 1; }
  updateAttMonthLabel();
  if (attCalState.userId) loadAttendanceMonth();
});

document.getElementById("attMngThisMonthBtn").addEventListener("click", () => {
  const now = new Date();
  attCalState.year = now.getFullYear();
  attCalState.month = now.getMonth() + 1;
  updateAttMonthLabel();
  if (attCalState.userId) loadAttendanceMonth();
});

// 表示中の月の打刻データをCSV出力する。
// ユーザー未選択なら全従業員分をまとめて出す (給与計算・監査用)。
document.getElementById("attMngExportBtn").addEventListener("click", async () => {
  const y = attCalState.year, m = attCalState.month;
  const last = new Date(y, m, 0).getDate();
  const dateFrom = `${y}-${String(m).padStart(2, "0")}-01`;
  const dateTo = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  const r = await api("listAttendance", {
    userId: attCalState.userId,
    store: attMngStoreFilterValue,
    dateFrom, dateTo,
  });
  const records = (r && r.records) || [];
  if (!records.length) {
    showToast(t("msgCsvEmpty"), "error");
    return;
  }
  records.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const typeKey = {
    clock_in: "logClockIn", clock_out: "logClockOut",
    break_start: "logBreakStart", break_end: "logBreakEnd",
  };
  const header = [
    t("date"), t("colEmployee"), t("positionLabel"), t("colStore"),
    t("attMngType"), t("attMngTime"),
  ];
  const lines = [header.map(csvEscape).join(",")];
  records.forEach((rec) => {
    lines.push([
      rec.date,
      rec.name,
      rec.role,
      rec.store,
      t(typeKey[rec.type] || rec.type),
      formatTime(rec.timestamp),
    ].map(csvEscape).join(","));
  });
  const ym = `${y}-${String(m).padStart(2, "0")}`;
  downloadCsv(`cham-cong-log_${ym}.csv`, "﻿" + lines.join("\r\n") + "\r\n");
  showToast(t("msgCsvExported").replace("{n}", records.length), "success");
});

async function loadAttendanceMonth() {
  const y = attCalState.year, m = attCalState.month;
  const last = new Date(y, m, 0).getDate();
  const dateFrom = `${y}-${String(m).padStart(2, "0")}-01`;
  const dateTo   = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  const r = await api("listAttendance", {
    userId: attCalState.userId,
    store: attMngStoreFilterValue,
    dateFrom, dateTo,
  });
  attCalState.byDate = {};
  ((r && r.records) || []).forEach((rec) => {
    const d = rec.date;
    if (!attCalState.byDate[d]) attCalState.byDate[d] = [];
    attCalState.byDate[d].push(rec);
  });
  Object.keys(attCalState.byDate).forEach((d) => {
    attCalState.byDate[d].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });
  renderAttendanceCalendar();
  updateAttMonthSummary();
}

// 月間総労働時間と出勤日数を集計してヘッダに表示。
// 算出ロジックは Code.gs:calcAttendanceLaborCost と整合させる:
// - clock_in → 次の clock_out までを労働時間
// - その間の break_start → break_end は控除
// - 退勤忘れ(対応する clock_out がない clock_in)は無視
// - 月跨ぎ夜勤等は表示中の月の範囲外イベントを読めないので、
//   その月内の clock_in を起点としたペアのみで計算する近似値
function updateAttMonthSummary() {
  // 月内の全打刻を時系列に
  const all = [];
  Object.keys(attCalState.byDate).forEach((d) => {
    attCalState.byDate[d].forEach((p) => all.push(p));
  });
  all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let totalMs = 0;
  let workDays = 0;
  const workDaySet = new Set();
  let clockIn = null;
  let breakStart = null;
  let breakTotalMs = 0;

  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    const ts = new Date(e.timestamp);
    if (e.type === "clock_in") {
      clockIn = ts;
      breakStart = null;
      breakTotalMs = 0;
      workDaySet.add(e.date);
    } else if (e.type === "break_start" && clockIn) {
      breakStart = ts;
    } else if (e.type === "break_end" && breakStart) {
      breakTotalMs += (ts - breakStart);
      breakStart = null;
    } else if (e.type === "clock_out" && clockIn) {
      const dur = (ts - clockIn) - breakTotalMs;
      if (dur > 0) totalMs += dur;
      clockIn = null;
      breakStart = null;
      breakTotalMs = 0;
    }
  }
  workDays = workDaySet.size;

  const totalMinutes = Math.round(totalMs / 60000);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  document.getElementById("attMngTotalHours").textContent =
    `${hh}h ${String(mm).padStart(2, "0")}m`;
  document.getElementById("attMngTotalDays").textContent =
    t("unitDaysFmt").replace("{n}", workDays);
}

function renderAttendanceCalendar() {
  const root = document.getElementById("attMngCalendar");
  root.innerHTML = "";

  // 曜日ヘッダー
  const weekdays = document.createElement("div");
  weekdays.className = "cal-weekdays";
  const wkKeys = ["weekdaySun", "weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat"];
  for (let i = 0; i < 7; i++) {
    const w = document.createElement("div");
    w.className = "cal-weekday";
    if (i === 0) w.classList.add("sun");
    if (i === 6) w.classList.add("sat");
    w.textContent = t(wkKeys[i]);
    weekdays.appendChild(w);
  }
  root.appendChild(weekdays);

  // 日付グリッド
  const grid = document.createElement("div");
  grid.className = "cal-grid";

  const firstDay = new Date(attCalState.year, attCalState.month - 1, 1);
  const lastDay = new Date(attCalState.year, attCalState.month, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((startWeekday + totalDays) / 7) * 7;
  const todayStr = todayLocalStr();

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "cal-day";
    const dayNum = i - startWeekday + 1;

    if (dayNum < 1 || dayNum > totalDays) {
      cell.classList.add("cal-other-month");
      const fillDay = dayNum < 1
        ? new Date(attCalState.year, attCalState.month - 1, dayNum)
        : new Date(attCalState.year, attCalState.month, dayNum - totalDays);
      const numEl = document.createElement("div");
      numEl.className = "cal-day-num";
      numEl.textContent = String(fillDay.getDate());
      cell.appendChild(numEl);
    } else {
      const weekday = (startWeekday + dayNum - 1) % 7;
      if (weekday === 0) cell.classList.add("cal-sun");
      if (weekday === 6) cell.classList.add("cal-sat");

      const dateStr = `${attCalState.year}-${String(attCalState.month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      if (dateStr === todayStr) cell.classList.add("cal-today");

      const numEl = document.createElement("div");
      numEl.className = "cal-day-num";
      numEl.textContent = String(dayNum);
      cell.appendChild(numEl);

      const punches = attCalState.byDate[dateStr] || [];
      if (punches.length) {
        const chips = document.createElement("div");
        chips.className = "att-day-chips";
        const ins  = punches.filter((p) => p.type === "clock_in");
        const outs = punches.filter((p) => p.type === "clock_out");
        const brks = punches.filter((p) => p.type === "break_start" || p.type === "break_end");
        // 接頭語 (出/Vào 等) は span にして、スマホ幅では CSS で隠す。
        // チップの色 (緑=出勤 / 赤=退勤) で種別は判別できる。
        const timeChip = (cls, prefix, time) => {
          const c = document.createElement("div");
          c.className = "att-day-chip " + cls;
          const p = document.createElement("span");
          p.className = "chip-prefix";
          p.textContent = prefix + " ";
          c.appendChild(p);
          c.appendChild(document.createTextNode(time));
          return c;
        };
        if (ins.length) {
          chips.appendChild(timeChip("in", t("chipIn"), hhmm(ins[0].timestamp)));
        }
        if (outs.length) {
          chips.appendChild(timeChip("out", t("chipOut"), hhmm(outs[outs.length - 1].timestamp)));
        }
        if (brks.length) {
          const c = document.createElement("div");
          c.className = "att-day-chip brk";
          c.textContent = t("chipBreakFmt").replace("{n}", Math.floor(brks.length / 2));
          chips.appendChild(c);
        }
        if (ins.length > outs.length) {
          const c = document.createElement("div");
          c.className = "att-day-chip warn";
          c.textContent = t("chipUnclosed");
          chips.appendChild(c);
        }
        cell.appendChild(chips);
      }
      cell.addEventListener("click", () => openAttDayModal(dateStr));
    }
    grid.appendChild(cell);
  }
  root.appendChild(grid);
}

// "2026-05-12T09:00:15+07:00" → "09:00"
function hhmm(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ----- 1日詳細モーダル -----
function openAttDayModal(dateStr) {
  attDayModalDate = dateStr;
  document.getElementById("attDayModalDate").textContent = formatShiftDate(dateStr);
  const userLabel = document.getElementById("attDayModalUser");
  const u = users.find((x) => String(x.id) === String(attCalState.userId));
  userLabel.textContent = u ? `(${u.name})` : "";
  renderAttDayPunches();
  document.getElementById("attDayModal").classList.remove("hidden");
}

function closeAttDayModal() {
  document.getElementById("attDayModal").classList.add("hidden");
}

document.getElementById("attDayClose").addEventListener("click", closeAttDayModal);
document.getElementById("attDayCancel").addEventListener("click", closeAttDayModal);
document.querySelector("#attDayModal .modal-backdrop").addEventListener("click", closeAttDayModal);
document.getElementById("attDayAddBtn").addEventListener("click", () => {
  const targetDate = attDayModalDate;
  closeAttDayModal();
  openAttEditModal(null, targetDate);
});

function renderAttDayPunches() {
  const root = document.getElementById("attDayPunches");
  root.innerHTML = "";
  const punches = attCalState.byDate[attDayModalDate] || [];
  if (!punches.length) {
    const empty = document.createElement("div");
    empty.className = "tx-empty";
    empty.textContent = t("attMngEmpty");
    root.appendChild(empty);
    return;
  }
  const typeLabels = {
    clock_in: "logClockIn", clock_out: "logClockOut",
    break_start: "logBreakStart", break_end: "logBreakEnd",
  };
  punches.forEach((rec) => {
    const row = document.createElement("div");
    row.className = "att-day-punch-row";

    const info = document.createElement("div");
    info.className = "att-day-punch-info";

    const time = document.createElement("span");
    time.className = "att-day-punch-time";
    time.textContent = formatTime(rec.timestamp);
    info.appendChild(time);

    const badge = document.createElement("span");
    badge.className = "att-type-badge att-type-" + rec.type;
    badge.textContent = t(typeLabels[rec.type] || rec.type);
    info.appendChild(badge);

    // どの店舗で打刻したかを出す (応援勤務の確認に使う)
    if (rec.store) {
      const st = document.createElement('span');
      st.className = 'att-day-punch-store';
      st.textContent = rec.store;
      info.appendChild(st);
    }

    // 個人選択モード固定なので名前は表示しない

    const actions = document.createElement("div");
    actions.className = "att-day-punch-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-ghost btn-sm";
    editBtn.textContent = "✏️";
    editBtn.title = t("attEditTitle");
    editBtn.addEventListener("click", () => {
      closeAttDayModal();
      openAttEditModal(rec);
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-ghost btn-sm";
    delBtn.style.color = "var(--danger)";
    delBtn.textContent = "🗑";
    delBtn.title = t("deleteBtn");
    delBtn.addEventListener("click", async () => {
      if (!confirm(t("msgDeleteConfirm"))) return;
      const r = await api("deleteAttendance", { id: rec.id });
      if (r.success) {
        showToast(t("msgAttendanceDeleted"), "success");
        await loadAttendanceMonth();
        renderAttDayPunches();
      } else {
        showToast(r.message || t("msgError"), "error");
      }
    });
    actions.appendChild(delBtn);

    row.appendChild(info);
    row.appendChild(actions);
    root.appendChild(row);
  });
}

// ----- 編集/追加モーダル -----
function openAttEditModal(rec, defaultDate) {
  const sel = document.getElementById("attEditUserId");
  sel.innerHTML = '<option value=""></option>';
  users.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    sel.appendChild(opt);
  });

  refreshStorePickerOptions();

  const title = document.getElementById("attEditTitle");
  if (rec) {
    title.textContent = t("attEditTitle");
    document.getElementById("attEditId").value = rec.id;
    document.getElementById("attEditUserId").value = rec.userId;
    document.getElementById("attEditDate").value = rec.date;
    document.getElementById("attEditTime").value = formatTime(rec.timestamp);
    document.getElementById("attEditType").value = rec.type;
    document.getElementById("attEditStore").value = rec.store || "";
    document.getElementById("attEditDelete").style.display = "";
  } else {
    title.textContent = t("attAddTitle");
    document.getElementById("attEditId").value = "";
    document.getElementById("attEditUserId").value = attCalState.userId || "";
    const now = new Date();
    document.getElementById("attEditDate").value = defaultDate ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    document.getElementById("attEditTime").value =
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    document.getElementById("attEditType").value = "clock_in";
    // 追加時は勤怠管理画面で絞り込んでいる店舗を既定にする
    document.getElementById("attEditStore").value = attMngStoreFilterValue || "";
    document.getElementById("attEditDelete").style.display = "none";
  }
  document.getElementById("attEditModal").classList.remove("hidden");
}

function closeAttEditModal() {
  document.getElementById("attEditModal").classList.add("hidden");
}

document.getElementById("attEditClose").addEventListener("click", closeAttEditModal);
document.getElementById("attEditCancel").addEventListener("click", closeAttEditModal);
document.querySelector("#attEditModal .modal-backdrop").addEventListener("click", closeAttEditModal);

document.getElementById("attEditForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("attEditId").value;
  const userId = document.getElementById("attEditUserId").value;
  const date = document.getElementById("attEditDate").value;
  const time = document.getElementById("attEditTime").value;
  const type = document.getElementById("attEditType").value;
  if (!userId || !date || !time || !type) {
    showToast(t("msgRequiredFields"), "error");
    return;
  }
  const store = document.getElementById("attEditStore").value;
  const payload = { userId, date, time, type, store };
  let r;
  if (id) {
    payload.id = id;
    r = await api("updateAttendance", payload);
  } else {
    r = await api("addAttendance", payload);
  }
  if (r.success) {
    showToast(t(id ? "msgAttendanceUpdated" : "msgAttendanceAdded"), "success");
    closeAttEditModal();
    loadAttendanceMonth();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

document.getElementById("attEditDelete").addEventListener("click", async () => {
  const id = document.getElementById("attEditId").value;
  if (!id) return;
  if (!confirm(t("msgDeleteConfirm"))) return;
  const r = await api("deleteAttendance", { id });
  if (r.success) {
    showToast(t("msgAttendanceDeleted"), "success");
    closeAttEditModal();
    loadAttendanceMonth();
  } else {
    showToast(r.message || t("msgError"), "error");
  }
});

// ============================================================
// Init
// ============================================================
applyLanguage();
showScreen("dashboardScreen");
setActiveDrawerItem("dashboard");
clearAttendanceUI();

// Pre-warm the GAS endpoint with a no-op request so the first real
// interaction (打刻 / 登録) doesn't pay the cold-start cost. Fired in the
// background — we don't await it. loadUsers() below also helps warm the
// instance.
(function preWarmGas() {
  try {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "__ping__" }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* ignore */ }
})();

loadUsers();
loadPatterns();
// 打刻・シフト登録の店舗セレクタを埋める (店舗マスタは全画面で共有)
loadKioskStores();
