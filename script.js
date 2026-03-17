// Constants
const MONTHLY_RENT = 5500;

// Global data variables
let roomsData = [];
let paymentHistory = [];
let maintenanceRequests = [];
let tenants = [];
let landlords = [];
let currentUser = null;
let currentUserType = null;

// DOM Elements
const homePage = document.getElementById('homePage');
const tenantDashboard = document.getElementById('tenantDashboard');
const landlordDashboard = document.getElementById('landlordDashboard');
const authModal = document.getElementById('authModal');
const doorsGrid = document.getElementById('doorsGrid');
const roomsTable = document.getElementById('roomsTable');
const paymentHistoryTable = document.getElementById('paymentHistory');
const tenantMaintenanceHistory = document.getElementById('tenantMaintenanceHistory');
const maintenanceRequestsTable = document.getElementById('maintenanceRequestsTable');
const vacantCount = document.getElementById('vacantCount');
const occupiedCount = document.getElementById('occupiedCount');
const monthlyIncome = document.getElementById('monthlyIncome');
const pendingMaintenanceCount = document.getElementById('pendingMaintenanceCount');
const tenantRegDoor = document.getElementById('tenantRegDoor');

// Authentication buttons
const tenantLoginBtn = document.getElementById('tenantLoginBtn');
const landlordLoginBtn = document.getElementById('landlordLoginBtn');
const tenantLogoutBtn = document.getElementById('tenantLogoutBtn');
const landlordLogoutBtn = document.getElementById('landlordLogoutBtn');
const tenantLoginSubmit = document.getElementById('tenantLoginSubmit');
const landlordLoginSubmit = document.getElementById('landlordLoginSubmit');
const tenantRegisterSubmit = document.getElementById('tenantRegisterSubmit');
const landlordRegisterSubmit = document.getElementById('landlordRegisterSubmit');

// Switch auth buttons
const switchToTenantRegister = document.getElementById('switchToTenantRegister');
const switchToLandlordRegister = document.getElementById('switchToLandlordRegister');
const switchToTenantLogin = document.getElementById('switchToTenantLogin');
const switchToLandlordLogin = document.getElementById('switchToLandlordLogin');

// Filter buttons
const filterVacantBtn = document.getElementById('filterVacantBtn');
const filterOccupiedBtn = document.getElementById('filterOccupiedBtn');
const showAllBtn = document.getElementById('showAllBtn');

// Auth tabs
const tenantTab = document.getElementById('tenantTab');
const landlordTab = document.getElementById('landlordTab');
const tenantAuthForm = document.getElementById('tenantAuthForm');
const landlordAuthForm = document.getElementById('landlordAuthForm');
const tenantRegisterForm = document.getElementById('tenantRegisterForm');
const landlordRegisterForm = document.getElementById('landlordRegisterForm');

// Payment and maintenance buttons
const makePaymentBtn = document.getElementById('makePaymentBtn');
const requestMaintenanceBtn = document.getElementById('requestMaintenanceBtn');

// ========== DATABASE FUNCTIONS ==========

// Initialize data in localStorage if not exists
function initializeData() {
    if (!localStorage.getItem('tenants')) {
        localStorage.setItem('tenants', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('landlords')) {
        // No default landlord - start with empty array
        localStorage.setItem('landlords', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('rooms')) {
        // Create rooms data - ALL DOORS VACANT
        const roomsData = Array.from({ length: 45 }, (_, i) => {
            const doorNumber = i + 1;
            return {
                doorNumber,
                status: 'vacant', // All doors are vacant
                tenantName: null,
                rentAmount: MONTHLY_RENT,
                lastPaymentDate: null,
                lastPaymentAmount: null,
                tenantId: null
            };
        });
        localStorage.setItem('rooms', JSON.stringify(roomsData));
    }
    
    if (!localStorage.getItem('payments')) {
        // Empty payment history
        localStorage.setItem('payments', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('maintenanceRequests')) {
        localStorage.setItem('maintenanceRequests', JSON.stringify([]));
    }
}

// Get data from localStorage
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Save data to localStorage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ========== AUTHENTICATION FUNCTIONS ==========

// Populate door options for tenant registration
function populateDoorOptions() {
    console.log("Populating door options...");
    
    if (!tenantRegDoor) {
        console.error("tenantRegDoor element not found!");
        return;
    }
    
    // Clear existing options except the first one
    while (tenantRegDoor.children.length > 1) {
        tenantRegDoor.removeChild(tenantRegDoor.lastChild);
    }
    
    // Get vacant rooms
    const vacantRooms = roomsData.filter(room => room.status === 'vacant');
    console.log("Vacant rooms:", vacantRooms);
    
    if (vacantRooms.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No vacant rooms available";
        option.disabled = true;
        tenantRegDoor.appendChild(option);
        return;
    }
    
    // Add vacant rooms to dropdown
    vacantRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.doorNumber;
        option.textContent = `Door ${room.doorNumber} - Ksh ${MONTHLY_RENT.toLocaleString()}/month`;
        tenantRegDoor.appendChild(option);
    });
    
    console.log("Door options populated successfully");
}

// Switch between tenant and landlord auth tabs
function switchAuthTab(tab) {
    if (tab === 'tenant') {
        tenantTab.classList.add('active');
        landlordTab.classList.remove('active');
        tenantAuthForm.classList.add('active');
        landlordAuthForm.classList.remove('active');
        tenantRegisterForm.classList.remove('active');
        landlordRegisterForm.classList.remove('active');
    } else {
        landlordTab.classList.add('active');
        tenantTab.classList.remove('active');
        landlordAuthForm.classList.add('active');
        tenantAuthForm.classList.remove('active');
        tenantRegisterForm.classList.remove('active');
        landlordRegisterForm.classList.remove('active');
    }
}

// ========== DASHBOARD FUNCTIONS ==========

// Render the doors grid on the home page
function renderDoorsGrid() {
    doorsGrid.innerHTML = '';
    
    roomsData.forEach(room => {
        const doorCard = document.createElement('div');
        doorCard.className = `door-card ${room.status}`;
        doorCard.innerHTML = `
            <div class="door-icon">${room.status === 'vacant' ? '🏠' : '🔒'}</div>
            <div class="door-number">Door ${room.doorNumber}</div>
            <div class="door-status ${room.status === 'vacant' ? 'status-vacant' : 'status-occupied'}">
                ${room.status === 'vacant' ? 'Vacant' : 'Occupied'}
            </div>
        `;
        doorsGrid.appendChild(doorCard);
    });
}

// Render the rooms table in the landlord dashboard
function renderRoomsTable(filter = 'all') {
    roomsTable.innerHTML = '';
    
    const filteredRooms = roomsData.filter(room => {
        if (filter === 'vacant') return room.status === 'vacant';
        if (filter === 'occupied') return room.status === 'occupied';
        return true;
    });
    
    filteredRooms.forEach(room => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Door ${room.doorNumber}</td>
            <td>
                <span class="door-status ${room.status === 'vacant' ? 'status-vacant' : 'status-occupied'}">
                    ${room.status === 'vacant' ? 'Vacant' : 'Occupied'}
                </span>
            </td>
            <td>${room.tenantName || '-'}</td>
            <td>${room.lastPaymentDate || '-'}</td>
            <td>${room.lastPaymentAmount ? `Ksh ${room.lastPaymentAmount.toLocaleString()}` : '-'}</td>
            <td>
                <button class="btn btn-outline toggle-status-btn" data-door="${room.doorNumber}">
                    ${room.status === 'vacant' ? 'Mark Occupied' : 'Mark Vacant'}
                </button>
            </td>
        `;
        roomsTable.appendChild(row);
    });
    
    // Add event listeners to toggle status buttons
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const doorNumber = parseInt(this.getAttribute('data-door'));
            toggleRoomStatus(doorNumber);
        });
    });
}

// Render payment history in tenant dashboard
function renderPaymentHistory() {
    paymentHistoryTable.innerHTML = '';
    
    if (currentUser && currentUserType === 'tenant') {
        const tenantPayments = paymentHistory.filter(payment => payment.tenantId === currentUser.doorNumber);
        
        if (tenantPayments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" style="text-align: center;">No payment history found</td>`;
            paymentHistoryTable.appendChild(row);
        } else {
            tenantPayments.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${payment.date}</td>
                    <td>Ksh ${payment.amount.toLocaleString()}</td>
                    <td>${payment.receiptNo}</td>
                    <td>${payment.method}</td>
                `;
                paymentHistoryTable.appendChild(row);
            });
        }
    }
}

// Render maintenance requests in landlord dashboard
function renderMaintenanceRequests() {
    maintenanceRequestsTable.innerHTML = '';
    tenantMaintenanceHistory.innerHTML = '';
    
    // For landlord dashboard
    if (maintenanceRequests.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center;">No maintenance requests found</td>`;
        maintenanceRequestsTable.appendChild(row);
    } else {
        maintenanceRequests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.date}</td>
                <td>Door ${request.doorNumber}</td>
                <td>${request.tenantName}</td>
                <td>${request.title}</td>
                <td>${request.urgency}</td>
                <td>
                    <span class="maintenance-status status-${request.status}">
                        ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                </td>
                <td>
                    ${request.status === 'pending' ? 
                        `<button class="btn btn-primary update-status-btn" data-id="${request.id}" data-status="in-progress">Start Work</button>` : 
                        request.status === 'in-progress' ?
                        `<button class="btn btn-primary update-status-btn" data-id="${request.id}" data-status="completed">Mark Complete</button>` :
                        'Completed'
                    }
                </td>
            `;
            maintenanceRequestsTable.appendChild(row);
        });
    }
    
    // For tenant dashboard
    if (currentUser && currentUserType === 'tenant') {
        const tenantRequests = maintenanceRequests.filter(request => 
            request.doorNumber === currentUser.doorNumber
        );
        
        if (tenantRequests.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" style="text-align: center;">No maintenance requests found</td>`;
            tenantMaintenanceHistory.appendChild(row);
        } else {
            tenantRequests.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.date}</td>
                    <td>${request.title}</td>
                    <td>${request.urgency}</td>
                    <td>
                        <span class="maintenance-status status-${request.status}">
                            ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                    </td>
                `;
                tenantMaintenanceHistory.appendChild(row);
            });
        }
    }
    
    // Add event listeners to update status buttons
    document.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = parseInt(this.getAttribute('data-id'));
            const newStatus = this.getAttribute('data-status');
            updateMaintenanceStatus(requestId, newStatus);
        });
    });
    
    // Update pending maintenance count
    const pendingCount = maintenanceRequests.filter(req => req.status === 'pending').length;
    pendingMaintenanceCount.textContent = pendingCount;
}

// Update statistics in landlord dashboard
function updateStats() {
    const vacantRooms = roomsData.filter(room => room.status === 'vacant').length;
    const occupiedRooms = roomsData.filter(room => room.status === 'occupied').length;
    const totalIncome = roomsData
        .filter(room => room.status === 'occupied')
        .reduce((sum, room) => sum + room.rentAmount, 0);
    
    vacantCount.textContent = vacantRooms;
    occupiedCount.textContent = occupiedRooms;
    monthlyIncome.textContent = `Ksh ${totalIncome.toLocaleString()}`;
}

// Toggle room status (vacant/occupied)
function toggleRoomStatus(doorNumber) {
    const roomIndex = roomsData.findIndex(room => room.doorNumber === doorNumber);
    if (roomIndex !== -1) {
        const room = roomsData[roomIndex];
        room.status = room.status === 'vacant' ? 'occupied' : 'vacant';
        
        if (room.status === 'occupied') {
            room.tenantName = `Tenant ${doorNumber}`;
            room.lastPaymentDate = new Date().toLocaleDateString();
            room.lastPaymentAmount = room.rentAmount;
        } else {
            room.tenantName = null;
            room.lastPaymentDate = null;
            room.lastPaymentAmount = null;
            room.tenantId = null;
        }
        
        saveData('rooms', roomsData);
        updateStats();
        renderRoomsTable();
        renderDoorsGrid();
        populateDoorOptions(); // Update door options after status change
    }
}

// Update maintenance request status
function updateMaintenanceStatus(requestId, newStatus) {
    const requestIndex = maintenanceRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
        maintenanceRequests[requestIndex].status = newStatus;
        saveData('maintenanceRequests', maintenanceRequests);
        renderMaintenanceRequests();
    }
}

// ========== EVENT LISTENERS SETUP ==========

// Set up authentication event listeners
function setupAuthEventListeners() {
    // Authentication buttons
    tenantLoginBtn.addEventListener('click', () => {
        homePage.style.display = 'none';
        authModal.style.display = 'block';
        switchAuthTab('tenant');
        populateDoorOptions(); // Ensure door options are updated
    });
    
    landlordLoginBtn.addEventListener('click', () => {
        homePage.style.display = 'none';
        authModal.style.display = 'block';
        switchAuthTab('landlord');
    });
    
    tenantLogoutBtn.addEventListener('click', () => {
        tenantDashboard.style.display = 'none';
        homePage.style.display = 'block';
        currentUser = null;
        currentUserType = null;
    });
    
    landlordLogoutBtn.addEventListener('click', () => {
        landlordDashboard.style.display = 'none';
        homePage.style.display = 'block';
        currentUser = null;
        currentUserType = null;
    });
    
    // Auth form submissions
    tenantLoginSubmit.addEventListener('click', () => {
        const email = document.getElementById('tenantEmail').value;
        const password = document.getElementById('tenantPassword').value;
        
        const tenant = tenants.find(t => t.email === email && t.password === password);
        if (tenant) {
            currentUser = tenant;
            currentUserType = 'tenant';
            authModal.style.display = 'none';
            tenantDashboard.style.display = 'block';
            
            // Update tenant info in dashboard
            document.getElementById('tenantName').textContent = tenant.name;
            document.getElementById('tenantContact').textContent = tenant.email;
            document.getElementById('tenantDoor').textContent = `Door ${tenant.doorNumber}`;
            document.getElementById('tenantRent').textContent = `Ksh ${MONTHLY_RENT.toLocaleString()}`;
            
            renderPaymentHistory();
            renderMaintenanceRequests();
        } else {
            alert('Invalid email or password. Please try again.');
        }
    });
    
    landlordLoginSubmit.addEventListener('click', () => {
        const email = document.getElementById('landlordEmail').value;
        const password = document.getElementById('landlordPassword').value;
        
        const landlord = landlords.find(l => l.email === email && l.password === password);
        if (landlord) {
            currentUser = landlord;
            currentUserType = 'landlord';
            authModal.style.display = 'none';
            landlordDashboard.style.display = 'block';
            
            // Update landlord info in dashboard
            document.getElementById('landlordName').textContent = landlord.name;
            
            // Refresh dashboard data
            updateStats();
            renderRoomsTable();
            renderMaintenanceRequests();
        } else {
            alert('Invalid email or password. Please try again.');
        }
    });
    
    // Registration form submissions
    tenantRegisterSubmit.addEventListener('click', () => {
        const name = document.getElementById('tenantRegName').value;
        const email = document.getElementById('tenantRegEmail').value;
        const phone = document.getElementById('tenantRegPhone').value;
        const doorNumber = parseInt(document.getElementById('tenantRegDoor').value);
        const password = document.getElementById('tenantRegPassword').value;
        const confirmPassword = document.getElementById('tenantRegConfirmPassword').value;
        
        if (!name || !email || !phone || !doorNumber || !password) {
            alert('Please fill in all fields.');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        
        // Check if email already exists
        if (tenants.find(t => t.email === email)) {
            alert('A tenant with this email already exists.');
            return;
        }
        
        // Check if door is still available
        const selectedRoom = roomsData.find(room => room.doorNumber === doorNumber);
        if (!selectedRoom || selectedRoom.status !== 'vacant') {
            alert('Selected door is no longer available. Please choose another door.');
            populateDoorOptions(); // Refresh the options
            return;
        }
        
        // Create new tenant
        const newTenant = {
            id: tenants.length > 0 ? Math.max(...tenants.map(t => t.id)) + 1 : 1,
            name,
            email,
            phone,
            doorNumber,
            password
        };
        
        tenants.push(newTenant);
        saveData('tenants', tenants);
        
        // Update room status
        const roomIndex = roomsData.findIndex(room => room.doorNumber === doorNumber);
        if (roomIndex !== -1) {
            roomsData[roomIndex].status = 'occupied';
            roomsData[roomIndex].tenantName = name;
            roomsData[roomIndex].tenantId = newTenant.id;
            saveData('rooms', roomsData);
        }
        
        alert('Registration successful! You can now login.');
        switchAuthTab('tenant');
        document.getElementById('tenantEmail').value = email;
        document.getElementById('tenantPassword').value = '';
        
        // Clear registration form
        document.getElementById('tenantRegName').value = '';
        document.getElementById('tenantRegEmail').value = '';
        document.getElementById('tenantRegPhone').value = '';
        document.getElementById('tenantRegPassword').value = '';
        document.getElementById('tenantRegConfirmPassword').value = '';
        document.getElementById('tenantRegDoor').value = '';
        
        // Update the UI
        updateStats();
        renderDoorsGrid();
        renderRoomsTable();
        populateDoorOptions();
    });
    
    landlordRegisterSubmit.addEventListener('click', () => {
        const name = document.getElementById('landlordRegName').value;
        const email = document.getElementById('landlordRegEmail').value;
        const phone = document.getElementById('landlordRegPhone').value;
        const password = document.getElementById('landlordRegPassword').value;
        const confirmPassword = document.getElementById('landlordRegConfirmPassword').value;
        
        if (!name || !email || !phone || !password) {
            alert('Please fill in all fields.');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        
        // Check if email already exists
        if (landlords.find(l => l.email === email)) {
            alert('A landlord with this email already exists.');
            return;
        }
        
        // Create new landlord
        const newLandlord = {
            id: landlords.length > 0 ? Math.max(...landlords.map(l => l.id)) + 1 : 1,
            name,
            email,
            phone,
            password
        };
        
        landlords.push(newLandlord);
        saveData('landlords', landlords);
        
        alert('Registration successful! You can now login.');
        switchAuthTab('landlord');
        document.getElementById('landlordEmail').value = email;
        document.getElementById('landlordPassword').value = '';
        
        // Clear registration form
        document.getElementById('landlordRegName').value = '';
        document.getElementById('landlordRegEmail').value = '';
        document.getElementById('landlordRegPhone').value = '';
        document.getElementById('landlordRegPassword').value = '';
        document.getElementById('landlordRegConfirmPassword').value = '';
    });
    
    // Switch auth forms
    switchToTenantRegister.addEventListener('click', () => {
        tenantAuthForm.classList.remove('active');
        tenantRegisterForm.classList.add('active');
        populateDoorOptions(); // Populate door options when switching to registration
    });
    
    switchToLandlordRegister.addEventListener('click', () => {
        landlordAuthForm.classList.remove('active');
        landlordRegisterForm.classList.add('active');
    });
    
    switchToTenantLogin.addEventListener('click', () => {
        tenantRegisterForm.classList.remove('active');
        tenantAuthForm.classList.add('active');
    });
    
    switchToLandlordLogin.addEventListener('click', () => {
        landlordRegisterForm.classList.remove('active');
        landlordAuthForm.classList.add('active');
    });
    
    // Auth tabs
    tenantTab.addEventListener('click', () => switchAuthTab('tenant'));
    landlordTab.addEventListener('click', () => switchAuthTab('landlord'));
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
            homePage.style.display = 'block';
        }
    });
}

// Set up dashboard event listeners
function setupDashboardEventListeners() {
    // Filter buttons
    filterVacantBtn.addEventListener('click', () => renderRoomsTable('vacant'));
    filterOccupiedBtn.addEventListener('click', () => renderRoomsTable('occupied'));
    showAllBtn.addEventListener('click', () => renderRoomsTable('all'));
    
    // Make payment button
    makePaymentBtn.addEventListener('click', () => {
        const amount = document.getElementById('paymentAmount').value;
        const method = document.getElementById('paymentMethod').value;
        
        if (!amount) {
            alert('Please enter payment amount.');
            return;
        }
        
        if (currentUser && currentUserType === 'tenant') {
            // In a real app, you would process payment here
            alert(`Payment of Ksh ${amount} via ${method} initiated!`);
            
            // Add to payment history (for demo)
            const today = new Date().toISOString().split('T')[0];
            const receiptNo = 'RCPT' + (paymentHistory.length + 1).toString().padStart(3, '0');
            
            const newPayment = {
                id: paymentHistory.length > 0 ? Math.max(...paymentHistory.map(p => p.id)) + 1 : 1,
                tenantId: currentUser.doorNumber,
                date: today,
                amount: parseInt(amount),
                receiptNo: receiptNo,
                method: method
            };
            
            paymentHistory.unshift(newPayment);
            saveData('payments', paymentHistory);
            
            // Update room last payment
            const roomIndex = roomsData.findIndex(room => room.doorNumber === currentUser.doorNumber);
            if (roomIndex !== -1) {
                roomsData[roomIndex].lastPaymentDate = today;
                roomsData[roomIndex].lastPaymentAmount = parseInt(amount);
                saveData('rooms', roomsData);
            }
            
            renderPaymentHistory();
            updateStats();
            
            // Clear payment amount
            document.getElementById('paymentAmount').value = '';
        }
    });
    
    // Request maintenance button
    requestMaintenanceBtn.addEventListener('click', () => {
        const title = document.getElementById('maintenanceTitle').value;
        const description = document.getElementById('maintenanceDescription').value;
        const urgency = document.getElementById('maintenanceUrgency').value;
        
        if (!title || !description) {
            alert('Please fill in both title and description.');
            return;
        }
        
        if (currentUser && currentUserType === 'tenant') {
            const today = new Date().toLocaleDateString();
            
            const newRequest = {
                id: maintenanceRequests.length > 0 ? Math.max(...maintenanceRequests.map(r => r.id)) + 1 : 1,
                doorNumber: currentUser.doorNumber,
                tenantName: currentUser.name,
                title,
                description,
                urgency,
                status: 'pending',
                date: today
            };
            
            maintenanceRequests.unshift(newRequest);
            saveData('maintenanceRequests', maintenanceRequests);
            
            alert('Maintenance request submitted successfully!');
            
            // Clear form
            document.getElementById('maintenanceTitle').value = '';
            document.getElementById('maintenanceDescription').value = '';
            document.getElementById('maintenanceUrgency').value = 'low';
            
            renderMaintenanceRequests();
        }
    });
}

// ========== APPLICATION INITIALIZATION ==========

// Initialize the application
function init() {
    initializeData();
    
    // Load data from localStorage
    roomsData = getData('rooms');
    paymentHistory = getData('payments');
    maintenanceRequests = getData('maintenanceRequests');
    tenants = getData('tenants');
    landlords = getData('landlords');
    
    renderDoorsGrid();
    updateStats();
    renderRoomsTable();
    renderPaymentHistory();
    renderMaintenanceRequests();
    populateDoorOptions();
    
    // Set up event listeners
    setupAuthEventListeners();
    setupDashboardEventListeners();
    
    // Hide dashboards initially
    tenantDashboard.style.display = 'none';
    landlordDashboard.style.display = 'none';
    authModal.style.display = 'none';
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);