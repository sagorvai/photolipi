// Global function to display custom messages instead of alert()
function showMessage(title, message) {
    const messageBoxOverlay = document.getElementById('message-box-overlay');
    const messageBoxTitle = document.getElementById('message-box-title');
    const messageBoxText = document.getElementById('message-box-text');
    const messageBoxOkBtn = document.getElementById('message-box-ok-btn');

    messageBoxTitle.textContent = title;
    messageBoxText.textContent = message;
    messageBoxOverlay.style.display = 'flex'; // Show the message box

    // Close the message box when OK button is clicked
    messageBoxOkBtn.onclick = () => {
        messageBoxOverlay.style.display = 'none';
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const featuredCategoriesContainer = document.getElementById('featured-categories-container');
    const regularCategoriesContainer = document.getElementById('regular-categories-container');

    const designDetailPopup = document.getElementById('design-detail-popup');
    const closeDesignDetailPopupBtn = document.getElementById('close-design-detail-popup');
    const popupDesignImage = document.getElementById('popup-design-image');
    const popupDesignName = document.getElementById('popup-design-name');
    const popupDesignDescription = document.querySelector('.popup-design-description');
    const popupDesignPrice = document.getElementById('popup-design-price');
    const selectDesignBtn = document.getElementById('select-design-btn');

    const orderDetailsPopup = document.getElementById('order-details-popup');
    const closeOrderDetailsPopupBtn = document.getElementById('close-order-details-popup');
    const fileUploadForm = document.getElementById('file-upload-form');
    const customerDesignFile = document.getElementById('customer-design-file'); // File input
    const customerNameInput = document.getElementById('customer-name');
    const customerMobileInput = document.getElementById('customer-mobile');
    const customerTitleInput = document.getElementById('customer-title');
    const customerOrganizationInput = document.getElementById('customer-organization');
    const customerBriefInput = document.getElementById('customer-brief');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    const floatingCartButton = document.getElementById('floating-cart-button');
    const cartItemCountSpan = document.getElementById('cart-item-count');

    const orderSummaryModal = document.getElementById('order-summary-modal');
    const closeOrderSummaryBtn = document.getElementById('close-order-summary-btn');
    const orderDateSpan = document.getElementById('order-date');
    const orderUniqueCodeSpan = document.getElementById('order-unique-code');
    const cartSummaryItemsContainer = document.getElementById('cart-summary-items');
    const finalTotalBillSpan = document.getElementById('final-total-bill');
    const bKashTotalSpan = document.getElementById('bKash-total');
    const paymentForm = document.getElementById('payment-form');
    const bKashTxnIdInput = document.getElementById('bKash-txn-id');
    const bKashSenderNumInput = document.getElementById('bKash-sender-num');

    const orderSuccessPopup = document.getElementById('order-success-popup');
    const closeSuccessPopupBtn = document.getElementById('close-success-popup-btn');
    const closeSuccessPopupBtnBottom = document.getElementById('close-success-popup-btn-bottom');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const whatsappFileShareBtn = document.getElementById('whatsapp-file-share-btn');

    // --- Global Variables ---
    let cart = [];
    let selectedDesign = null;
    let currentOrderCode = '';
    let currentOrderDate = ''; // Will store English date string for PDF
    let lastSubmittedOrderData = null; // To hold data for PDF download

    // --- GOOGLE APPS SCRIPT URLs ---
    const GOOGLE_APPS_SCRIPT_PRODUCTS_URL = "https://script.google.com/macros/s/AKfycbyecR4VKIJ2K5n_3gAjnUFZm4seZWUtL8lMQGuY0o1LIIDwCvHpLCyFhkacqz3rc2SG1w/exec"; 
    const GOOGLE_APPS_SCRIPT_ORDERS_URL = "https://script.google.com/macros/s/AKfycbyBGei3PDbYmWf1aL4FTWgX8ncQd9fZ3aORFKwPH2dnEZDgzEAV67jK2wvv-_fwlXv/exec";   
    // --- END OF URLS ---

    // --- Helper Functions ---

    // Function to convert Bengali numbers to English numbers for processing/PDF
    function convertBengaliNumbersToEnglish(inputString) {
        if (!inputString) return '';
        const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let convertedString = '';
        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];
            const index = bengaliNumbers.indexOf(char);
            if (index !== -1) {
                convertedString += englishNumbers[index];
            } else {
                convertedString += char;
            }
        }
        return convertedString;
    }

    // Generate a unique order code
    function generateOrderCode() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const uniqueId = Math.random().toString(36).substr(2, 4).toUpperCase(); // Random 4-char string
        return `FOTOLIPI-${year}${month}${day}-${uniqueId}`;
    }

    // Update cart display and floating button visibility
    function updateCartDisplay() {
        cartSummaryItemsContainer.innerHTML = '';
        let total = 0;
        let totalItemCount = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price; // Price is for the design itself
            total += itemTotal;
            totalItemCount++;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-summary-item');
            itemElement.innerHTML = `
                <span class="item-name-summary">★ ${item.name}</span>
                <span class="item-price-summary">${itemTotal} টাকা</span>
                <button class="remove-item-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            `;
            cartSummaryItemsContainer.appendChild(itemElement);
        });

        finalTotalBillSpan.textContent = total;
        bKashTotalSpan.textContent = total; // For bKash instructions

        if (totalItemCount > 0) {
            floatingCartButton.style.display = 'flex';
            cartItemCountSpan.textContent = totalItemCount;
        } else {
            floatingCartButton.style.display = 'none';
            cartItemCountSpan.textContent = 0;
            orderSummaryModal.style.display = 'none';
        }

        const now = new Date();
        currentOrderDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); // English date for PDF
        currentOrderCode = generateOrderCode();

        orderDateSpan.textContent = currentOrderDate;
        orderUniqueCodeSpan.textContent = currentOrderCode;
    }

    // --- Data Loading from Google Sheet ---
    async function loadDesignsFromSheet() {
        try {
            const response = await fetch(GOOGLE_APPS_SCRIPT_PRODUCTS_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const designsData = await response.json();
            
            if (designsData.error) {
                showMessage('ডিজাইন লোড করতে সমস্যা', 'Apps Script থেকে ডিজাইন ডেটা লোড করা যায়নি: ' + designsData.error);
                console.error('Apps Script Error:', designsData.error);
                return;
            }
            renderDesigns(designsData);

        } catch (error) {
            console.error('Error loading designs from sheet:', error);
            showMessage('ডিজাইন লোড করতে সমস্যা', 'ডিজাইন তালিকা লোড করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
        }
    }

    // Render designs into the respective containers
    function renderDesigns(designsToRender) {
        // Clear existing designs
        featuredCategoriesContainer.innerHTML = '';
        regularCategoriesContainer.innerHTML = '';

        const categoriesMap = new Map(); // Stores { categoryName: { isFeatured: boolean, element: HTMLDivElement, gridElement: HTMLDivElement } }

        // First pass: Group designs by category and identify featured categories
        designsToRender.forEach(design => {
            if (!design.Name || design.Name.toString().trim() === '' ||
                !design.Price || design.Price.toString().trim() === '' ||
                !design.Category || design.Category.toString().trim() === '') {
                console.warn('Skipping invalid design row:', design);
                return;
            }

            const categoryName = design.Category.trim();
            const isFeaturedDesign = (design.Featured && (design.Featured.toString().toLowerCase().trim() === 'yes' || design.Featured.toString().toLowerCase().trim() === 'true'));

            if (!categoriesMap.has(categoryName)) {
                // Create category group container if it doesn't exist
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('design-category-group');
                
                const categoryHeading = document.createElement('h3');
                categoryHeading.textContent = categoryName;
                categoryHeading.classList.add('design-category-heading');

                const designGridDiv = document.createElement('div');
                designGridDiv.classList.add('design-grid');
                
                categoryDiv.appendChild(categoryHeading);
                categoryDiv.appendChild(designGridDiv);

                categoriesMap.set(categoryName, {
                    isFeatured: false, // Will be set to true if any design in it is featured
                    element: categoryDiv,
                    gridElement: designGridDiv,
                    designs: [] // Store design data temporarily for sorting within category
                });
            }

            const categoryEntry = categoriesMap.get(categoryName);
            if (isFeaturedDesign) {
                categoryEntry.isFeatured = true; // Mark category as featured if any design in it is featured
            }
            categoryEntry.designs.push(design); // Store design data to sort later
        });

        // Convert map to array and sort categories (featured first)
        const sortedCategories = Array.from(categoriesMap.values()).sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return 0; // Maintain original order for non-featured or both featured
        });

        // Second pass: Populate the grids and append category groups to respective containers
        sortedCategories.forEach(categoryEntry => {
            // Sort designs within each category (e.g., by name or price, or keep original order)
            // For now, no specific sort within category, just iterate stored designs
            categoryEntry.designs.forEach(design => {
                const designItem = document.createElement('div');
                designItem.classList.add('design-item');
                designItem.dataset.name = design.Name;
                designItem.dataset.price = design.Price;
                designItem.dataset.description = design.Description || 'কোনো বিবরণ নেই।';
                designItem.dataset.imageUrl = design['Image URL'] || 'https://placehold.co/300x200/cccccc/333333?text=ছবি+নেই';
                designItem.dataset.category = design.Category;

                designItem.innerHTML = `
                    <img src="${designItem.dataset.imageUrl}" alt="${design.Name} ডিজাইন">
                    <div class="design-item-content">
                        <h4>${design.Name}</h4>
                        <p class="price">${design.Price} টাকা</p>
                    </div>
                `;

                // Open popup on click
                designItem.addEventListener('click', () => {
                    popupDesignImage.src = designItem.dataset.imageUrl;
                    popupDesignName.textContent = designItem.dataset.name;
                    popupDesignDescription.textContent = designItem.dataset.description;
                    popupDesignPrice.textContent = designItem.dataset.price;
                    selectedDesign = {
                        name: designItem.dataset.name,
                        price: parseFloat(designItem.dataset.price),
                        description: designItem.dataset.description,
                        imageUrl: designItem.dataset.imageUrl,
                        category: designItem.dataset.category
                    };
                    designDetailPopup.style.display = 'flex';
                });

                // Append design item to its category's grid element
                categoryEntry.gridElement.appendChild(designItem);
            });

            // Append the full category group to the correct main container
            if (categoryEntry.isFeatured) {
                featuredCategoriesContainer.appendChild(categoryEntry.element);
            } else {
                regularCategoriesContainer.appendChild(categoryEntry.element);
            }
        });
    }

    // --- Event Listeners ---

    // Close Design Detail Popup
    closeDesignDetailPopupBtn.addEventListener('click', () => {
        designDetailPopup.style.display = 'none';
        selectedDesign = null;
    });

    // Select Design & Open Order Details Popup
    selectDesignBtn.addEventListener('click', () => {
        if (selectedDesign) {
            designDetailPopup.style.display = 'none';
            orderDetailsPopup.style.display = 'flex';
            // Clear previous form data
            fileUploadForm.reset();
            // Optional: Prefill customer details if needed from local storage
        }
    });

    // Close Order Details Popup
    closeOrderDetailsPopupBtn.addEventListener('click', () => {
        orderDetailsPopup.style.display = 'none';
        selectedDesign = null; // Clear selected design if user cancels
    });

    // Add to Cart from Order Details Popup
    fileUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!selectedDesign) {
            showMessage('ত্রুটি', 'কোনো ডিজাইন নির্বাচন করা হয়নি।');
            return;
        }

        const customerName = customerNameInput.value.trim();
        const customerMobile = convertBengaliNumbersToEnglish(customerMobileInput.value.trim()); // Convert mobile to English
        const customerTitle = customerTitleInput.value.trim();
        const customerOrganization = customerOrganizationInput.value.trim();
        const customerBrief = customerBriefInput.value.trim();
        
        // Get file names for WhatsApp message, but don't upload the files
        const files = customerDesignFile.files;
        let fileNames = [];
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                fileNames.push(files[i].name);
            }
        }

        // Add selected design and customer info to cart
        cart.push({
            ...selectedDesign,
            customerName,
            customerMobile,
            customerTitle,
            customerOrganization,
            customerBrief,
            uploadedFileNames: fileNames.join(', ') // Store file names as a string
        });

        showMessage('সফল!', `${selectedDesign.name} আপনার কার্টে যুক্ত হয়েছে।`);
        orderDetailsPopup.style.display = 'none';
        selectedDesign = null; // Clear selected design after adding to cart
        updateCartDisplay();
    });

    // Handle removing item from cart summary
    cartSummaryItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn') || e.target.closest('.remove-item-btn')) {
            const button = e.target.closest('.remove-item-btn');
            const indexToRemove = parseInt(button.dataset.index);
            cart.splice(indexToRemove, 1);
            updateCartDisplay();
        }
    });

    // Floating Cart Button click to open Order Summary
    floatingCartButton.addEventListener('click', () => {
        if (cart.length > 0) {
            updateCartDisplay(); // Refresh display before showing
            orderSummaryModal.style.display = 'flex';
        }
    });

    // Close Order Summary Popup
    closeOrderSummaryBtn.addEventListener('click', () => {
        orderSummaryModal.style.display = 'none';
    });

    // Payment Form Submission (Final Order Placement)
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            showMessage('ত্রুটি', 'কোনো ডিজাইন নির্বাচন করা হয়নি।');
            return;
        }

        const bKashTxnId = bKashTxnIdInput.value.trim();
        const bKashSenderNum = convertBengaliNumbersToEnglish(bKashSenderNumInput.value.trim()); // Convert to English numbers

        if (!bKashTxnId || !bKashSenderNum) {
            showMessage('তথ্য পূরণ করুন', 'দয়া করে বিকাশ Transaction ID এবং আপনার বিকাশ নম্বর পূরণ করুন।');
            return;
        }

        // Prepare data for Google Sheet
        const orderDataForSheet = {
            orderCode: currentOrderCode,
            orderDate: currentOrderDate,
            customerName: cart[0].customerName, // Assuming one customer for the entire cart
            customerMobile: cart[0].customerMobile,
            customerTitle: cart[0].customerTitle,
            customerOrganization: cart[0].customerOrganization,
            paymentMethod: 'bKash',
            bKashTxnId: bKashTxnId,
            bKashSenderNum: bKashSenderNum,
            totalBill: parseFloat(finalTotalBillSpan.textContent),
            designs: cart.map(item => ({
                name: item.name,
                price: item.price,
                description: item.description,
                uploadedFileNames: item.uploadedFileNames,
                customerBrief: item.customerBrief // Individual brief for each design
            }))
        };

        lastSubmittedOrderData = orderDataForSheet; // Save for PDF generation

        try {
            const loadingMessageTitle = 'অর্ডার প্রক্রিয়া চলছে...';
            const loadingMessageText = 'আপনার অর্ডার জমা দেওয়া হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...';
            showMessage(loadingMessageTitle, loadingMessageText);

            orderSummaryModal.style.display = 'none';

            // Send order data to Google Sheet
            const response = await fetch(GOOGLE_APPS_SCRIPT_ORDERS_URL, {
                method: 'POST',
                mode: 'no-cors', // Required for Google Apps Script POST requests
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderDataForSheet),
            });

            console.log('Order data sent to Google Sheet (check your sheet)!');
            
            document.getElementById('message-box-overlay').style.display = 'none'; // Hide loading message
            orderSuccessPopup.style.display = 'flex'; // Show success popup

            // Update WhatsApp share button with dynamic order code
            const whatsappMessage = `প্রিয় ফটোলিপি টিম, আমার অর্ডার কোড: ${currentOrderCode}%0Aআমার নাম: ${cart[0].customerName}%0Aআমার মোবাইল: ${cart[0].customerMobile}%0A%0Aআমি আমার ডিজাইনের ফাইলগুলো শেয়ার করতে চাই।`;
            whatsappFileShareBtn.href = `https://wa.me/8801951912031?text=${encodeURIComponent(whatsappMessage)}`;

            // Clear cart and form after successful order
            cart = [];
            fileUploadForm.reset();
            paymentForm.reset();
            customerNameInput.value = ''; // Also clear customer info
            customerMobileInput.value = '';
            customerTitleInput.value = '';
            customerOrganizationInput.value = '';
            customerBriefInput.value = '';
            updateCartDisplay();

        } catch (error) {
            console.error('Error sending order:', error);
            document.getElementById('message-box-overlay').style.display = 'none'; // Hide loading
            showMessage('অর্ডার জমা দিতে সমস্যা', 'অর্ডার জমা দিতে সমস্যা হয়েছে। দয়া করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।');
        }
    });

    // --- PDF Generation Function ---
    async function generateInvoicePdf(orderData) {
        try {
            const pdf = new window.jspdf.jsPDF('portrait', 'pt', 'a4');
            pdf.setFont('helvetica', 'normal');
            
            let y = 50;
            const lineHeightFactor = 1.2;
            const leftMargin = 50;
            const rightMargin = pdf.internal.pageSize.width - 50;
            const tableWidth = pdf.internal.pageSize.width - (2 * leftMargin);

            // Columns for item table
            const colWidthsArray = [
                tableWidth * 0.35, // Item Name (35%)
                tableWidth * 0.40, // Description (40%)
                tableWidth * 0.25  // Price (25%)
            ];

            const col1X = leftMargin + 5;
            const col2X = leftMargin + colWidthsArray[0] + 5;
            const col3X = rightMargin - 5; // Align price to right

            // Company Header
            pdf.setFontSize(20);
            pdf.text('Fotolipi', pdf.internal.pageSize.width / 2, y, { align: 'center' });
            y += (20 * lineHeightFactor);
            pdf.setFontSize(12);
            pdf.text('Your Vision, Our Design!', pdf.internal.pageSize.width / 2, y, { align: 'center' });
            y += (15 * lineHeightFactor);
            pdf.setFontSize(10);
            pdf.text('Contact: +8801951912031 | info@fotolipi.com', pdf.internal.pageSize.width / 2, y, { align: 'center' });
            y += (30 * lineHeightFactor);

            // Invoice Details
            pdf.setFontSize(14);
            pdf.text('INVOICE:', leftMargin, y);
            y += (15 * lineHeightFactor);
            
            pdf.text(`Date: ${orderData.orderDate}`, leftMargin, y);
            y += (15 * lineHeightFactor);
            pdf.text(`Order Code: ${orderData.orderCode}`, leftMargin, y);
            y += (30 * lineHeightFactor);

            // Customer Information (Dynamic)
            pdf.setFontSize(12);
            pdf.text('Customer Name: ' + orderData.customerName, leftMargin, y);
            y += (15 * lineHeightFactor);
            pdf.text('Mobile No: ' + orderData.customerMobile, leftMargin, y);
            y += (15 * lineHeightFactor);
            if (orderData.customerTitle && orderData.customerTitle.trim() !== '') {
                pdf.text('Title: ' + orderData.customerTitle, leftMargin, y);
                y += (15 * lineHeightFactor);
            }
            if (orderData.customerOrganization && orderData.customerOrganization.trim() !== '') {
                pdf.text('Organization: ' + orderData.customerOrganization, leftMargin, y);
                y += (15 * lineHeightFactor);
            }
            y += (20 * lineHeightFactor); // Extra space before items table

            // Table Header
            pdf.setFontSize(12);
            pdf.setFillColor(242, 242, 242);
            const headerHeight = 20;
            pdf.rect(leftMargin, y, tableWidth, headerHeight, 'F');
            pdf.setTextColor(0, 0, 0);
            
            pdf.text('Item', col1X, y + (headerHeight / 2) + 4);
            pdf.text('Description', col2X, y + (headerHeight / 2) + 4, { align: 'left' }); // Adjusted align
            pdf.text('Price', col3X, y + (headerHeight / 2) + 4, { align: 'right' });
            y += headerHeight;

            // Table Rows
            pdf.setFontSize(10); // Slightly smaller for item details
            orderData.designs.forEach(item => {
                const itemName = item.name;
                const itemBrief = item.customerBrief || 'N/A'; // Use customer brief
                const itemPrice = item.price;

                const textLineHeight = pdf.getFontSize() * lineHeightFactor;
                let rowHeight = textLineHeight; // Default for single line

                // Item Name (Single line, truncated if too long)
                // We keep it on one line as per user request, with ellipsis in UI. PDF will simply truncate.
                const itemNameLines = pdf.splitTextToSize(itemName, colWidthsArray[0] - 10);
                const itemBriefLines = pdf.splitTextToSize(itemBrief, colWidthsArray[1] - 10);
                
                // Calculate max height needed for current row based on item name or brief
                const maxTextHeight = Math.max(itemNameLines.length * textLineHeight, itemBriefLines.length * textLineHeight);
                rowHeight = maxTextHeight > rowHeight ? maxTextHeight : rowHeight;
                if (rowHeight < 20) rowHeight = 20; // Minimum row height

                pdf.rect(leftMargin, y, tableWidth, rowHeight, 'S');

                // Print Item Name
                pdf.text(itemNameLines, col1X, y + (textLineHeight * 0.75));

                // Print Item Brief
                pdf.text(itemBriefLines, col2X, y + (textLineHeight * 0.75));

                // Price
                pdf.text(`${itemPrice} BDT`, col3X, y + (textLineHeight * 0.75), { align: 'right' });
                
                y += rowHeight;

                // Page breaking logic
                if (y > pdf.internal.pageSize.height - 150 && orderData.designs.indexOf(item) < orderData.designs.length - 1) {
                    pdf.addPage();
                    y = 50;
                    pdf.setFontSize(12);
                    pdf.setFillColor(242, 242, 242);
                    pdf.rect(leftMargin, y, tableWidth, headerHeight, 'F');
                    pdf.setTextColor(0, 0, 0);
                    pdf.text('Item', col1X, y + (headerHeight / 2) + 4);
                    pdf.text('Description', col2X, y + (headerHeight / 2) + 4, { align: 'left' });
                    pdf.text('Price', col3X, y + (headerHeight / 2) + 4, { align: 'right' });
                    y += headerHeight;
                    pdf.setFontSize(10);
                }
            });

            y += (20 * lineHeightFactor);

            // Total Bill
            pdf.setFontSize(16);
            pdf.text('Total Bill:', rightMargin - 125, y, { align: 'right' });
            pdf.setFontSize(20);
            pdf.text(`${orderData.totalBill} BDT`, rightMargin, y + 5, { align: 'right' });
            y += (20 * lineHeightFactor);

            // Payment Info
            pdf.setFontSize(12);
            pdf.text('Payment Method: bKash', leftMargin, y);
            y += (15 * lineHeightFactor);
            pdf.text('Transaction ID: ' + orderData.bKashTxnId, leftMargin, y);
            y += (15 * lineHeightFactor);
            pdf.text('Sender Number: ' + orderData.bKashSenderNum, leftMargin, y);
            y += (30 * lineHeightFactor);

            // Important Note for Files
            pdf.setFontSize(10);
            pdf.text('Important: Please share your design files via WhatsApp to +8801951912031 using your Order Code.', pdf.internal.pageSize.width / 2, y, { align: 'center' });
            y += (20 * lineHeightFactor);

            // Thank You Message
            pdf.setFontSize(10);
            pdf.text('Thank you for choosing Fotolipi!', pdf.internal.pageSize.width / 2, y, { align: 'center' });
            y += (12 * lineHeightFactor);
            pdf.text('Your creativity, our design.', pdf.internal.pageSize.width / 2, y, { align: 'center' });

            pdf.save(`Invoice_Fotolipi_${orderData.orderCode}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            showMessage('PDF Generation Issue', 'Failed to generate PDF invoice. Please try again. Error: ' + error.message);
        }
    }

    // --- Popup Close Event Listeners ---
    closeSuccessPopupBtn.addEventListener('click', () => {
        orderSuccessPopup.style.display = 'none';
    });
    
    closeSuccessPopupBtnBottom.addEventListener('click', () => {
        orderSuccessPopup.style.display = 'none';
    });

    downloadPdfBtn.addEventListener('click', () => {
        if (lastSubmittedOrderData) {
            generateInvoicePdf(lastSubmittedOrderData);
        } else {
            showMessage('পিডিএফ ত্রুটি', 'পিডিএফ তৈরি করার জন্য কোনো অর্ডারের তথ্য নেই।');
        }
    });

    // --- Floating Button Drag Functionality (unchanged) ---
    let isDragging = false;
    let offsetX, offsetY;

    floatingCartButton.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - floatingCartButton.getBoundingClientRect().left;
        offsetY = e.clientY - floatingCartButton.getBoundingClientRect().top;
        floatingCartButton.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - floatingCartButton.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - floatingCartButton.offsetHeight));

        floatingCartButton.style.left = `${newLeft}px`;
        floatingCartButton.style.top = `${newTop}px`;
        floatingCartButton.style.right = 'auto'; // Disable right/bottom if setting left/top
        floatingCartButton.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        floatingCartButton.style.cursor = 'grab';
    });

    // Touch events for dragging on mobile devices
    floatingCartButton.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - floatingCartButton.getBoundingClientRect().left;
        offsetY = touch.clientY - floatingCartButton.getBoundingClientRect().top;
        floatingCartButton.style.cursor = 'grabbing';
    }, { passive: true }); // Use passive: true for better scroll performance

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling while dragging

        const touch = e.touches[0];
        let newLeft = touch.clientX - offsetX;
        let newTop = touch.clientY - offsetY;

        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - floatingCartButton.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - floatingCartButton.offsetHeight));

        floatingCartButton.style.left = `${newLeft}px`;
        floatingCartButton.style.top = `${newTop}px`;
        floatingCartButton.style.right = 'auto';
        floatingCartButton.style.bottom = 'auto';
    }, { passive: false }); // Use passive: false to allow preventDefault

    document.addEventListener('touchend', () => {
        isDragging = false;
        floatingCartButton.style.cursor = 'grab';
    });


    // Initial setup
    updateCartDisplay(); // Initialize cart display
    loadDesignsFromSheet(); // Load designs when page loads
});
