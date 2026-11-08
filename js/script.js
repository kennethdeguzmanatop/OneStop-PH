(() => {
    const detailLinks = document.querySelectorAll('a[href*="detail.html?id="]');

    detailLinks.forEach(link => {
        const target = new URL(link.getAttribute('href'), window.location.href);

        const updateDetailHref = () => {
            const current = window.location.pathname + window.location.search + window.location.hash;

            target.searchParams.set('return', current);
            target.searchParams.set('returnY', String(Math.max(0, window.scrollY || window.pageYOffset || 0)));

            link.setAttribute('href', target.pathname.split('/').pop() + target.search + target.hash);
        };

        updateDetailHref();
        link.addEventListener('click', updateDetailHref);
    });

    const restoreY = sessionStorage.getItem('onestop-return-scroll');

    if (restoreY !== null) {
        sessionStorage.removeItem('onestop-return-scroll');

        const y = Number.parseInt(restoreY, 10);

        if (Number.isFinite(y) && y >= 0) {
            window.addEventListener('load', () => {
                requestAnimationFrame(() => window.scrollTo(0, y));
            }, { once: true });
        }
    }

    const detailBack = document.querySelector('.detail-aside .full-button');

    if (!detailBack) return;

    const params = new URLSearchParams(window.location.search);
    const safeReturn = params.get('return');

    const isSafeLocalReturn = value => {
        if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
            return false;
        }

        try {
            return new URL(value, window.location.origin).origin === window.location.origin;
        } catch {
            return false;
        }
    };

    const id = params.get('id') || '';

    const categoryById = {
        'hapag-vicenticos': 'category.html',
        'marias-kitchen': 'category.html',
        'cabanatuan-longganisa': 'category.html',
        'heneral-luna': 'search.html?cat=movies',
        'goyo-ang-batang-heneral': 'search.html?cat=movies',
        'maria-clara-at-ibarra': 'search.html?cat=series',
        'iv-of-spades': 'search.html?cat=music',
        'patintero': 'search.html?cat=games',
        'sungka': 'search.html?cat=games',
        'minalungao-national-park': 'search.html?cat=spots',
        'pantabangan-lake': 'search.html?cat=spots',
        'gabaldon-falls': 'search.html?cat=spots',
        'camp-pangatian-shrine': 'search.html?cat=spots',
        'sibuyas-festival': 'search.html?cat=events',
        'taong-putik-festival': 'search.html?cat=events'
    };

    const fallback = categoryById[id] || 'categories.html';
    const returnTo = isSafeLocalReturn(safeReturn) ? safeReturn : fallback;
    const returnY = params.get('returnY') || '0';

    detailBack.href = returnTo;

    const returnUrl = new URL(returnTo, window.location.origin);
    const returnFile = returnUrl.pathname.split('/').pop();
    const returnCategory = (returnUrl.searchParams.get('cat') || '').toLowerCase();

    const label = returnFile === 'category.html' || returnCategory === 'food'
        ? 'Back to Foods'
        : (returnFile === 'index.html' || returnFile === '' || returnTo === '/')
            ? 'Back to Home'
            : returnCategory === 'movies'
                ? 'Back to Movies'
                : returnCategory === 'series'
                    ? 'Back to TV Series'
                    : returnCategory === 'music'
                        ? 'Back to Music'
                        : returnCategory === 'games'
                            ? 'Back to Games'
                            : returnCategory === 'spots'
                                ? 'Back to Tourist Spots'
                                : returnCategory === 'events'
                                    ? 'Back to Local Events'
                                    : returnFile === 'categories.html'
                                        ? 'Back to All Categories'
                                        : returnFile === 'search.html'
                                            ? 'Back to Explore'
                                            : 'Back to All Categories';

    detailBack.textContent = label + ' ←';

    detailBack.addEventListener('click', () => {
        sessionStorage.setItem(
            'onestop-return-scroll',
            String(Math.max(0, Number.parseInt(returnY, 10) || 0))
        );
    });

    const breadcrumbExplore = document.querySelector('.breadcrumb a[href="search.html"]');

    if (breadcrumbExplore) {
        breadcrumbExplore.href = returnTo;
        breadcrumbExplore.textContent = label.replace('Back to ', '');
    }
})();

const menuButton = document.querySelector('.menu-toggle');
const mainNavigation = document.querySelector('.main-nav');

if (menuButton && mainNavigation) {
    menuButton.addEventListener('click', () => {
        const isOpen = mainNavigation.classList.toggle('show');

        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute(
            'aria-label',
            isOpen ? 'Close navigation menu' : 'Open navigation menu'
        );
        menuButton.textContent = isOpen ? '×' : '☰';
    });
}

document.querySelectorAll('.search-form').forEach(form => {
    form.addEventListener('submit', event => {
        const searchInput = form.querySelector("input[name='q']");

        if (!searchInput || !searchInput.value.trim()) {
            event.preventDefault();

            if (searchInput) {
                searchInput.focus();
            }
        }
    });
});

(() => {
    const baseSuggestions = [
        'Minalungao National Park',
        'Cabanatuan Garlic Longganisa',
        'Sibuyas Festival',
        'Taong Putik Festival',
        'Hapag Vicenticos',
        'Nueva Ecija',
        'Filipino food',
        'Filipino movies',
        'Filipino TV series',
        'OPM music',
        'Traditional Filipino games',
        'Local events',
        'Pantabangan Lake',
        'Gabaldon Falls',
        'Pangatian Memorial Shrine',
        'Patintero',
        'Sungka'
    ];

    const cardSuggestions = [...document.querySelectorAll('.recommendation-card[data-name]')]
        .map(card => card.dataset.name)
        .filter(Boolean);

    const allSuggestions = [...new Set([...baseSuggestions, ...cardSuggestions])];

    document.querySelectorAll('.search-form').forEach((form, formIndex) => {
        const input = form.querySelector("input[name='q']");

        if (!input) return;

        input.removeAttribute('list');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');

        const panel = document.createElement('div');

        panel.className = 'omnibox-panel';
        panel.id = `omnibox-suggestions-${formIndex}`;
        panel.setAttribute('role', 'listbox');
        panel.setAttribute('aria-label', 'Search suggestions');
        panel.hidden = true;

        form.appendChild(panel);
        input.setAttribute('aria-controls', panel.id);

        let activeIndex = -1;
        let visibleItems = [];

        const close = () => {
            panel.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            activeIndex = -1;
        };

        const choose = value => {
            input.value = value;
            close();
            form.requestSubmit();
        };

        const highlight = index => {
            const options = [...panel.querySelectorAll('[role="option"]')];

            if (!options.length) return;

            activeIndex = (index + options.length) % options.length;

            options.forEach((option, i) => {
                option.classList.toggle('is-active', i === activeIndex);
                option.setAttribute('aria-selected', String(i === activeIndex));
            });

            input.setAttribute('aria-activedescendant', options[activeIndex].id);
            options[activeIndex].scrollIntoView({ block: 'nearest' });
        };

        const render = () => {
            const query = input.value.trim().toLowerCase();

            visibleItems = query
                ? allSuggestions
                    .filter(item => item.toLowerCase().includes(query))
                    .sort((a, b) => {
                        const aStarts = a.toLowerCase().startsWith(query) ? 0 : 1;
                        const bStarts = b.toLowerCase().startsWith(query) ? 0 : 1;

                        return aStarts - bStarts || a.localeCompare(b);
                    })
                    .slice(0, 7)
                : allSuggestions.slice(0, 7);

            panel.replaceChildren();

            const heading = document.createElement('div');

            heading.className = 'omnibox-heading';
            heading.textContent = query ? 'SUGGESTED SEARCHES' : 'POPULAR SEARCHES';

            panel.appendChild(heading);

            if (!visibleItems.length) {
                const emptyMessage = document.createElement('p');

                emptyMessage.className = 'omnibox-empty';
                emptyMessage.textContent =
                    'No suggestions found. Press Enter to search for “' +
                    input.value.trim() +
                    '”.';

                panel.appendChild(emptyMessage);
            }

            visibleItems.forEach((value, index) => {
                const option = document.createElement('button');

                option.type = 'button';
                option.className = 'omnibox-option';
                option.id = `${panel.id}-option-${index}`;
                option.setAttribute('role', 'option');
                option.setAttribute('aria-selected', 'false');

                const icon = document.createElement('span');

                icon.className = 'omnibox-option-icon';
                icon.setAttribute('aria-hidden', 'true');

                const label = document.createElement('span');

                label.className = 'omnibox-option-label';
                label.textContent = value;

                option.setAttribute('aria-label', value);
                option.appendChild(icon);
                option.appendChild(label);

                option.addEventListener('mousedown', event => event.preventDefault());
                option.addEventListener('click', () => choose(value));

                panel.appendChild(option);
            });

            panel.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            activeIndex = -1;
        };

        input.addEventListener('input', render);
        input.addEventListener('focus', render);

        input.addEventListener('keydown', event => {
            if (panel.hidden) return;

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                highlight(activeIndex + 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                highlight(activeIndex < 0 ? visibleItems.length - 1 : activeIndex - 1);
            } else if (event.key === 'Escape') {
                close();
            } else if (event.key === 'Enter' && activeIndex >= 0) {
                event.preventDefault();
                choose(visibleItems[activeIndex]);
            }
        });

        document.addEventListener('click', event => {
            if (!form.contains(event.target)) {
                close();
            }
        });

        form.addEventListener('submit', close);
    });
})();

const foodsGrid = document.getElementById('recommendationGrid');

if (foodsGrid) {
    const foodsSummary = document.getElementById('foodsSummary');
    const foodsCount = foodsGrid.querySelectorAll('.recommendation-card').length;

    if (foodsSummary) {
        foodsSummary.textContent =
            `${foodsCount} recommendation${foodsCount === 1 ? '' : 's'} in Foods`;
    }
}

const searchResults = document.getElementById('searchResults');

if (searchResults) {
    const params = new URLSearchParams(window.location.search);
    const searchInput = document.querySelector(".site-header input[name='q']");
    const summary = document.getElementById('searchSummary');
    const emptyMessage = document.getElementById('noSearchResults');
    const cards = [...searchResults.querySelectorAll('.recommendation-card')];

    const categoryNames = {
        food: 'Foods',
        movies: 'Movies',
        series: 'TV Series',
        music: 'Music',
        games: 'Games',
        spots: 'Tourist Spots',
        events: 'Local Events'
    };

    let currentQuery = params.get('q') || '';
    let currentCategory = (params.get('cat') || '').toLowerCase();

    const breadcrumb = document.querySelector('.breadcrumb');

    const updateSearchBreadcrumb = () => {
        if (!breadcrumb) return;

        const categoryLabel = categoryNames[currentCategory];
        const pageLabel = categoryLabel || (currentQuery ? 'Search' : 'All Categories');

        breadcrumb.innerHTML = '<a href="index.html">Home</a> / ' + pageLabel;
        breadcrumb.setAttribute('aria-label', `Home / ${pageLabel}`);
    };

    if (searchInput) {
        searchInput.value = currentQuery;
    }

    const normalize = value => {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const runSearch = () => {
        updateSearchBreadcrumb();

        const words = normalize(currentQuery).split(' ').filter(Boolean);
        let count = 0;

        cards.forEach(card => {
            const categories = (card.dataset.category || '').toLowerCase().split(/\s+/);
            const categoryMatch = !currentCategory || categories.includes(currentCategory);

            const content = normalize(
                `${card.dataset.name || ''} ${card.dataset.category || ''} ${card.dataset.keywords || ''} ${card.textContent}`
            );

            const textMatch = words.length === 0 || words.every(word => content.includes(word));
            const matched = categoryMatch && textMatch;

            card.hidden = !matched;

            if (matched) {
                count++;
            }
        });

        if (summary) {
            const label = categoryNames[currentCategory];

            summary.textContent = currentQuery
                ? `${count} result${count === 1 ? '' : 's'} for “${currentQuery}”${label ? ` in ${label}` : ''}`
                : `${count} recommendation${count === 1 ? '' : 's'}${label ? ` in ${label}` : ''}`;
        }

        if (emptyMessage) {
            emptyMessage.hidden = count !== 0;
        }

        document.querySelectorAll('.category-chips a').forEach(link => {
            const url = new URL(link.href, window.location.href);
            const cat = (url.searchParams.get('cat') || '').toLowerCase();

            link.classList.toggle(
                'active',
                cat === currentCategory &&
                (cat !== '' || link.textContent.trim() === 'All Categories')
            );
        });
    };

    runSearch();

    const headerSearch = document.querySelector('.site-header .search-form');

    if (headerSearch) {
        headerSearch.addEventListener('submit', event => {
            event.preventDefault();

            currentQuery = searchInput.value.trim();

            const next = new URLSearchParams();

            if (currentQuery) {
                next.set('q', currentQuery);
            }

            if (currentCategory) {
                next.set('cat', currentCategory);
            }

            const queryString = next.toString();

            window.history.pushState(
                {},
                '',
                `search.html${queryString ? `?${queryString}` : ''}`
            );

            runSearch();
        });
    }

    window.addEventListener('popstate', () => {
        const next = new URLSearchParams(window.location.search);

        currentQuery = next.get('q') || '';
        currentCategory = (next.get('cat') || '').toLowerCase();

        if (searchInput) {
            searchInput.value = currentQuery;
        }

        runSearch();
    });
}

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const topicInput = document.getElementById('topic');
    const messageInput = document.getElementById('message');
    const status = document.getElementById('formStatus');
    const charCount = document.getElementById('charCount');

    const setError = (input, message) => {
        const errorElement = document.getElementById(`${input.id}Error`);

        if (errorElement) {
            errorElement.textContent = message;
        }

        input.setAttribute('aria-invalid', String(Boolean(message)));
    };

    if (messageInput && charCount) {
        messageInput.addEventListener('input', () => {
            charCount.textContent = `${messageInput.value.length} / 500`;
        });
    }

    contactForm.addEventListener('submit', async event => {
        event.preventDefault();

        if (status) {
            status.textContent = '';
        }

        const nameValid = nameInput.value.trim().length >= 2;
        const emailValid = emailInput.validity.valid && emailInput.value.trim() !== '';
        const messageValid = messageInput.value.trim().length >= 10;

        setError(
            nameInput,
            nameValid ? '' : 'Please enter at least 2 characters for your name.'
        );

        setError(
            emailInput,
            emailValid ? '' : 'Please enter a valid email address.'
        );

        setError(
            messageInput,
            messageValid ? '' : 'Your message must contain at least 10 characters.'
        );

        if (!(nameValid && emailValid && messageValid && contactForm.checkValidity())) {
            if (status) {
                status.textContent = 'Please check the highlighted fields.';
            }

            return;
        }

        const config = window.ONE_STOP_EMAILJS || {};

        if (!window.emailjs || !config.publicKey || !config.serviceId || !config.contactTemplateId) {
            if (status) {
                status.textContent =
                    'Email service is not configured. Please check js/emailjs-config.js.';
            }

            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : '';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending…';
        }

        if (status) {
            status.textContent = 'Sending your message…';
        }

        const params = {
            to_email: config.recipientEmail,
            from_name: nameInput.value.trim(),
            reply_to: emailInput.value.trim(),
            topic: topicInput.value || 'General question',
            message: messageInput.value.trim()
        };

        try {
            await emailjs.send(config.serviceId, config.contactTemplateId, params, {
                publicKey: config.publicKey
            });

            try {
                if (
                    config.autoReplyPublicKey &&
                    config.autoReplyServiceId &&
                    config.contactAutoReplyTemplateId
                ) {
                    await emailjs.send(
                        config.autoReplyServiceId,
                        config.contactAutoReplyTemplateId,
                        params,
                        {
                            publicKey: config.autoReplyPublicKey
                        }
                    );
                }
            } catch (autoReplyError) {
                console.error('EmailJS contact auto-reply failed:', autoReplyError);
            }

            if (status) {
                status.textContent = 'Thank you! Your message was sent successfully.';
            }

            contactForm.reset();

            if (charCount) {
                charCount.textContent = '0 / 500';
            }

            [nameInput, emailInput, messageInput].forEach(field => {
                field.setAttribute('aria-invalid', 'false');
            });
        } catch (error) {
            console.error('EmailJS contact submission failed:', error);

            if (status) {
                status.textContent = "We couldn't send your message. Please try again.";
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
}

const recommendationForm = document.getElementById('recommendationForm');

if (recommendationForm) {
    recommendationForm.addEventListener('submit', async event => {
        event.preventDefault();

        const fields = [
            'recName',
            'recCategory',
            'recLocation',
            'recEmail',
            'recDescription'
        ];

        let isValid = true;

        fields.forEach(id => {
            const input = document.getElementById(id);
            const error = document.getElementById(`${id}Error`);

            const valid = input.checkValidity() &&
                (input.type !== 'text' || input.value.trim().length >= 2);

            if (error) {
                error.textContent = valid
                    ? ''
                    : input.validationMessage || 'Please complete this field.';
            }

            input.setAttribute('aria-invalid', String(!valid));

            if (!valid) {
                isValid = false;
            }
        });

        const confirmation = document.getElementById('confirmInfo');
        const confirmationError = document.getElementById('confirmInfoError');

        if (confirmationError) {
            confirmationError.textContent = confirmation.checked
                ? ''
                : 'Please confirm the information before submitting.';
        }

        if (!confirmation.checked) {
            isValid = false;
        }

        const status = document.getElementById('recommendationStatus');

        if (!isValid) {
            if (status) {
                status.textContent = 'Please review the highlighted fields.';
            }

            return;
        }

        const config = window.ONE_STOP_EMAILJS || {};

        if (
            !window.emailjs ||
            !config.publicKey ||
            !config.serviceId ||
            !config.recommendationTemplateId
        ) {
            if (status) {
                status.textContent =
                    'EmailJS is not configured yet. Add your Public Key, Service ID, and Template ID in js/emailjs-config.js.';
            }

            return;
        }

        const submitButton = recommendationForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : '';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending…';
        }

        if (status) {
            status.textContent = 'Sending your recommendation…';
        }

        const params = {
            to_email: config.recipientEmail,
            recommendation_name: document.getElementById('recName').value.trim(),
            category: document.getElementById('recCategory').value,
            location: document.getElementById('recLocation').value.trim(),
            sender_email: document.getElementById('recEmail').value.trim(),
            website: document.getElementById('recWebsite').value.trim() || 'Not provided',
            budget: document.getElementById('recBudget').value
                ? `₱${document.getElementById('recBudget').value}`
                : 'Not provided',
            description: document.getElementById('recDescription').value.trim(),
            reply_to: document.getElementById('recEmail').value.trim()
        };

        try {
            await emailjs.send(config.serviceId, config.recommendationTemplateId, params, {
                publicKey: config.publicKey
            });

            try {
                if (
                    config.autoReplyPublicKey &&
                    config.autoReplyServiceId &&
                    config.recommendationAutoReplyTemplateId
                ) {
                    await emailjs.send(
                        config.autoReplyServiceId,
                        config.recommendationAutoReplyTemplateId,
                        params,
                        {
                            publicKey: config.autoReplyPublicKey
                        }
                    );
                }
            } catch (autoReplyError) {
                console.error('EmailJS recommendation auto-reply failed:', autoReplyError);
            }

            if (status) {
                status.textContent = 'Thank you! Your recommendation was sent successfully.';
            }

            recommendationForm.reset();

            fields.forEach(id => {
                document.getElementById(id).setAttribute('aria-invalid', 'false');
            });

            if (confirmationError) {
                confirmationError.textContent = '';
            }
        } catch (error) {
            console.error('EmailJS recommendation submission failed:', error);

            if (status) {
                status.textContent =
                    "We couldn't send your recommendation. Please check the EmailJS setup and try again.";
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
}

const greetingButton = document.getElementById('greetingButton');

if (greetingButton) {
    const updateGreeting = () => {
        const currentHour = new Date().getHours();

        const greeting = currentHour < 12
            ? 'Good morning'
            : currentHour < 18
                ? 'Good afternoon'
                : 'Good evening';

        document.getElementById('greetingOutput').textContent =
            `${greeting}, explorer.`;

        document.getElementById('timeOutput').textContent =
            `Your local time is ${new Date().toLocaleTimeString()}.`;
    };

    greetingButton.addEventListener('click', updateGreeting);
    window.addEventListener('load', updateGreeting);
}

const itemForm = document.getElementById('itemForm');

if (itemForm) {
    const itemInput = document.getElementById('itemInput');
    const list = document.getElementById('discoveryList');

    itemForm.addEventListener('submit', event => {
        event.preventDefault();

        const value = itemInput.value.trim();

        if (!value) {
            return itemInput.focus();
        }

        const listItem = document.createElement('li');
        const itemText = document.createElement('span');
        const removeButton = document.createElement('button');

        itemText.textContent = value;

        removeButton.type = 'button';
        removeButton.className = 'remove-item';
        removeButton.setAttribute('aria-label', `Remove ${value}`);
        removeButton.textContent = '×';

        listItem.append(itemText, removeButton);
        list.append(listItem);

        itemInput.value = '';
        itemInput.focus();
    });

    list.addEventListener('click', event => {
        if (event.target.matches('.remove-item')) {
            event.target.closest('li').remove();
        }
    });
}

const detailTitle = document.getElementById('detailTitle');

if (detailTitle) {
    const data = {
        'hapag-vicenticos': {
            name: 'Hapag Vicenticos',
            category: 'Foods',
            tag: 'LOCAL RESTAURANT',
            description: 'A well-known restaurant in Cabanatuan serving Filipino dishes and local favorites. The Nueva Ecija provincial tourism site includes Hapag Vicenticos among the province’s tourism and food establishments.',
            visual: 'visual-food',
            location: 'Cabanatuan City, Nueva Ecija',
            price: 'Check with the restaurant',
            image: 'assets/images/recommendations/Vicenticos.jpg',
            alt: 'Hapag Vicenticos restaurant facade and dining area',
            source: 'https://www.nuevaecija.ph/tourism/',
            sourceLabel: 'Nueva Ecija Provincial Tourism'
        },
        'cabanatuan-longganisa': {
            name: 'Cabanatuan Garlic Longganisa',
            category: 'Foods',
            tag: 'LOCAL FOOD',
            description: 'Cabanatuan is known for its garlic longganisa. Nueva Ecija’s provincial tourism office also identifies Cabanatuan longganisa as one of the province’s local food products.',
            visual: 'visual-food',
            location: 'Cabanatuan City, Nueva Ecija',
            price: 'Varies by seller',
            image: 'assets/images/recommendations/cabanatuan_longanisa.jpg',
            alt: 'Cabanatuan garlic longganisa at a local market',
            source: 'https://www.nuevaecija.ph/tourism/',
            sourceLabel: 'Nueva Ecija Provincial Tourism'
        },
        'marias-kitchen': {
            name: 'Maria’s Kitchen',
            category: 'Foods',
            tag: 'LOCAL RESTAURANT',
            description: 'The official General Tinio tourism page lists Maria’s Kitchen as a dining establishment in Barangay Padolina, serving Filipino, Korean, Western dishes, and pizza.',
            visual: 'visual-food',
            location: 'Barangay Padolina, General Tinio, Nueva Ecija',
            price: 'Check with the restaurant',
            image: 'assets/images/recommendations/marias_kitchen.jpg',
            alt: 'Filipino food from Nueva Ecija; illustrative food photograph',
            source: 'https://www.generaltinio.gov.ph/tourism',
            sourceLabel: 'Municipality of General Tinio Tourism'
        },
        'heneral-luna': {
            name: 'Heneral Luna (2015)',
            category: 'Movies',
            tag: 'FILIPINO FILM',
            description: 'A Philippine historical action film directed by Jerrold Tarog. It follows General Antonio Luna during the Philippine-American War and explores the divisions within the revolutionary government.',
            visual: 'visual-film',
            location: 'Philippines',
            price: 'Availability varies by streaming platform',
            image: 'assets/images/recommendations/heneral_luna.webp',
            alt: 'Heneral Luna film poster',
            source: 'https://www.tba.ph/heneral-luna/',
            sourceLabel: 'TBA Studios – Official Film Information'
        },
        'goyo-ang-batang-heneral': {
            name: 'Goyo: Ang Batang Heneral (2018)',
            category: 'Movies',
            tag: 'FILIPINO FILM',
            description: 'A Filipino historical drama directed by Jerrold Tarog about Gregorio del Pilar. It is the follow-up to Heneral Luna and was announced for nationwide screening by TBA Studios in 2018.',
            visual: 'visual-film',
            location: 'Philippines',
            price: 'Availability varies by streaming platform',
            image: 'assets/images/recommendations/goyo_ang_batang_heneral.jpg',
            alt: 'Goyo Ang Batang Heneral film poster',
            source: 'https://www.deped.gov.ph/wp-content/uploads/2018/09/DA_s2018_170.pdf',
            sourceLabel: 'Department of Education advisory on the film'
        },
        'maria-clara-at-ibarra': {
            name: 'Maria Clara at Ibarra',
            category: 'TV Series',
            tag: 'FILIPINO TV SERIES',
            description: 'A GMA historical fantasy-drama series inspired by José Rizal’s Noli Me Tangere and El Filibusterismo. The series features characters from the novels and a modern-day perspective on Philippine history.',
            visual: 'visual-film',
            location: 'Philippines',
            price: 'Check the broadcaster or streaming platform',
            image: 'assets/images/recommendations/mariaclara_ibarra.png',
            alt: 'Maria Clara at Ibarra promotional image',
            source: 'https://www.gmanetwork.com/entertainment/showbiznews/maria-clara-at-ibarra-nagagamit-sa-guided-tours-ng-intramuros-para-maka-relate-sa-kabataan/93888/',
            sourceLabel: 'GMA Entertainment'
        },
        'iv-of-spades': {
            name: 'IV of Spades',
            category: 'Music',
            tag: 'OPM BAND',
            description: 'IV of Spades is a Filipino pop-rock band known for songs such as “Mundo.” GMA News reported the group’s return and releases in 2025–2026.',
            visual: 'visual-music',
            location: 'Metro Manila, Philippines',
            price: 'Music streaming availability varies',
            image: 'assets/images/recommendations/IV_of_Spades.jpeg',
            alt: 'IV of Spades band members',
            source: 'https://www.gmanetwork.com/entertainment/photos/meet-iv-of-spades-as-they-reunite-for-a-comeback/24449',
            sourceLabel: 'GMA Entertainment – IV of Spades profile'
        },
        'patintero': {
            name: 'Patintero',
            category: 'Games',
            tag: 'TRADITIONAL FILIPINO GAME',
            description: 'Patintero is a traditional Filipino team game played on a marked rectangular court. Players try to cross the lines while avoiding the opposing team. The National Commission for Culture and the Arts documents the game as part of Filipino play culture.',
            visual: 'visual-event',
            location: 'Played throughout the Philippines',
            price: 'Free to play',
            image: 'assets/images/recommendations/Patintero.jpg',
            alt: 'Young people playing patintero on a marked court',
            source: 'https://ncca.gov.ph/about-culture-and-arts/in-focus/traditional-games-in-the-philippines/',
            sourceLabel: 'National Commission for Culture and the Arts'
        },
        'sungka': {
            name: 'Sungka',
            category: 'Games',
            tag: 'TRADITIONAL FILIPINO GAME',
            description: 'Sungka is a two-player traditional board game using a wooden board with fourteen small pits and two larger home pits. The National Museum of the Philippines includes sungka in its ethnology collection on games and recreation.',
            visual: 'visual-music',
            location: 'Played throughout the Philippines',
            price: 'Board set price varies',
            image: 'assets/images/recommendations/sungka.jpg',
            alt: 'Traditional wooden sungka board with shells',
            source: 'https://www.nationalmuseum.gov.ph/our-collections/ethnology/games-hobbies-recreation/',
            sourceLabel: 'National Museum of the Philippines'
        },
        'minalungao-national-park': {
            name: 'Minalungao National Park',
            category: 'Tourist Spots',
            tag: 'NATURE DESTINATION',
            description: 'A protected natural destination known for its green river and limestone formations. The park was established through Republic Act No. 5100 in 1967 and is promoted by Nueva Ecija and General Tinio tourism offices.',
            visual: 'visual-travel',
            location: 'General Tinio, Nueva Ecija',
            price: 'Check current local fees and advisories',
            image: 'assets/images/recommendations/minalungaonationalpark.jpg',
            alt: 'Minalungao National Park river between limestone cliffs',
            source: 'https://generaltinio.gov.ph/view/article/34',
            sourceLabel: 'Official General Tinio Government Website'
        },
        'pantabangan-lake': {
            name: 'Pantabangan Lake',
            category: 'Tourist Spots',
            tag: 'NATURE DESTINATION',
            description: 'A major lake and outdoor destination in Nueva Ecija. The provincial tourism office features Pantabangan Dam and the lake among the province’s adventure destinations.',
            visual: 'visual-travel',
            location: 'Pantabangan, Nueva Ecija',
            price: 'Check local access and activity fees',
            image: 'assets/images/recommendations/pantabangan.jpg',
            alt: 'Pantabangan Lake with floating raft houses',
            source: 'https://www.nuevaecija.ph/tourism/',
            sourceLabel: 'Nueva Ecija Provincial Tourism'
        },
        'gabaldon-falls': {
            name: 'Gabaldon Falls',
            category: 'Tourist Spots',
            tag: 'NATURE DESTINATION',
            description: 'A waterfall destination near Mt. Mingan, surrounded by boulders and vegetation. It is listed among Nueva Ecija’s tourism destinations. Check local conditions before travelling.',
            visual: 'visual-travel',
            location: 'Gabaldon, Nueva Ecija',
            price: 'Check local access and guide fees',
            image: 'assets/images/recommendations/gabaldonfalls.webp',
            alt: 'Gabaldon Falls surrounded by tropical vegetation',
            source: 'https://www.nuevaecija.ph/destinations/gabaldon-falls/',
            sourceLabel: 'Nueva Ecija Provincial Tourism'
        },
        'camp-pangatian-shrine': {
            name: 'Pangatian Memorial Shrine',
            category: 'Tourist Spots',
            tag: 'HISTORICAL SITE',
            description: 'A memorial site in Cabanatuan associated with the 1945 raid that liberated Allied prisoners of war. It is included in Nueva Ecija’s official tourism destinations.',
            visual: 'visual-travel',
            location: 'Cabanatuan City, Nueva Ecija',
            price: 'Check visiting arrangements',
            image: 'assets/images/recommendations/camppangatiancabanatuannuevaecija.jpg',
            alt: 'Camp Pangatian memorial shrine in Cabanatuan',
            source: 'https://www.nuevaecija.ph/tourism/',
            sourceLabel: 'Nueva Ecija Provincial Tourism'
        },
        'sibuyas-festival': {
            name: 'Sibuyas Festival',
            category: 'Local Events',
            tag: 'ANNUAL LOCAL FESTIVAL',
            description: 'A community celebration in Bongabon that highlights the town’s onion-growing industry and local identity. The festival is listed by the Nueva Ecija provincial tourism office among the province’s town celebrations. Dates and activities vary by year.',
            visual: 'visual-event',
            location: 'Bongabon, Nueva Ecija',
            price: 'Event schedule and admission vary',
            image: 'assets/images/recommendations/onioninspiredpropduringthestreetparadephotobyEdgarAllanMSembrano.jpg',
            alt: 'Sibuyas Festival street parade in Bongabon',
            source: 'https://www.nuevaecija.ph/tourism/',
            sourceLabel: 'Nueva Ecija Provincial Tourism'
        },
        'taong-putik-festival': {
            name: 'Taong Putik Festival',
            category: 'Local Events',
            tag: 'CULTURAL FESTIVAL',
            description: 'A religious and cultural tradition in Aliaga, Nueva Ecija, also known as the Feast of San Juan Bautista. It is recognized in the provincial tourism office’s listing of faith-related festivals. Check the municipal announcements for current program details.',
            visual: 'visual-event',
            location: 'Aliaga, Nueva Ecija',
            price: 'Festival schedule varies annually',
            image: 'assets/images/recommendations/taong_putik.jpg',
            alt: 'Devotee taking part in the Taong Putik Festival in Aliaga, Nueva Ecija',
            source: 'https://www.nuevaecija.ph/tourism/',
            sourceLabel: 'Nueva Ecija Provincial Tourism'
        }
    };

    const id = new URLSearchParams(window.location.search).get('id');
    const item = data[id];

    if (item) {
        document.title = `${item.name} | OneStop PH`;

        detailTitle.textContent = item.name;
        document.getElementById('detailSubtitle').textContent = item.description;
        document.getElementById('detailHeading').textContent = `About ${item.name}`;
        document.getElementById('detailDescription').textContent = item.description;

        document.getElementById('detailReason').textContent =
            `${item.name} is included because it is a documented Filipino destination, cultural item, creative work, or local establishment. Check the source for the latest details.`;

        document.getElementById('detailInitials').textContent = item.name
            .split(/\s+/)
            .slice(0, 2)
            .map(word => word[0])
            .join('')
            .toUpperCase();

        document.getElementById('detailTag').textContent = item.tag;
        document.getElementById('detailVisual').className = `detail-visual ${item.visual}`;

        const detailImage = document.getElementById('detailImage');

        if (detailImage) {
            detailImage.src = item.image;
            detailImage.alt = item.alt;
            detailImage.referrerPolicy = 'no-referrer';
        }

        document.getElementById('detailCategory').textContent = item.category;
        document.getElementById('detailRating').textContent =
            'Source referenced · No fabricated rating';
        document.getElementById('detailLocation').textContent = item.location;
        document.getElementById('detailPrice').textContent = item.price;

        const sourceLink = document.getElementById('detailSource');

        if (sourceLink) {
            sourceLink.href = item.source;
            sourceLink.textContent = item.sourceLabel;
        }
    } else {
        detailTitle.textContent = 'Recommendation not found.';

        document.getElementById('detailSubtitle').textContent =
            'This item may have been removed or the link is incorrect.';

        document.querySelector('.detail-layout').innerHTML =
            '<div class="content-panel"><h2>No details available.</h2><p>Please return to the recommendations page and choose an available listing.</p><a class="button button-dark" href="search.html">Browse recommendations →</a></div>';
    }
}

const featuredSlides = [...document.querySelectorAll('.hero-feature')];

if (featuredSlides.length) {
    const controls = document.querySelector('.hero-controls');
    const dots = [...document.querySelectorAll('.hero-dot')];
    const previous = document.querySelector('.hero-prev');
    const next = document.querySelector('.hero-next');
    const pause = document.querySelector('.hero-pause');

    let activeSlide = Math.max(
        0,
        featuredSlides.findIndex(slide => slide.classList.contains('active'))
    );

    let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rotationTimer = null;

    const updatePauseControl = () => {
        if (!pause) return;

        pause.textContent = paused ? '▶' : 'Ⅱ';
        pause.setAttribute(
            'aria-label',
            paused ? 'Resume automatic featured rotation' : 'Pause automatic featured rotation'
        );
        pause.setAttribute('aria-pressed', String(paused));
        pause.title = paused ? 'Resume slideshow' : 'Pause slideshow';
    };

    const heroBackgrounds = [
        'assets/images/recommendations/minalungaonationalpark.jpg',
        'assets/images/recommendations/cabanatuan_longanisa.jpg',
        'assets/images/recommendations/onioninspiredpropduringthestreetparadephotobyEdgarAllanMSembrano.jpg'
    ];

    const showSlide = index => {
        activeSlide = (index + featuredSlides.length) % featuredSlides.length;

        const hero = document.querySelector('.featured-hero');

        if (hero && heroBackgrounds[activeSlide]) {
            const heroImage = hero.querySelector('.hero-background-image');

            if (heroImage) {
                heroImage.src = heroBackgrounds[activeSlide];

                heroImage.alt = [
                    'Minalungao National Park in Nueva Ecija',
                    'Cabanatuan garlic longganisa',
                    'Sibuyas Festival street celebration in Bongabon'
                ][activeSlide] || 'Featured local discovery in the Philippines';
            }

            hero.style.setProperty(
                '--hero-image',
                `url("${heroBackgrounds[activeSlide]}")`
            );
        }

        featuredSlides.forEach((slide, i) => {
            const active = i === activeSlide;

            slide.classList.toggle('active', active);
            slide.setAttribute('aria-hidden', String(!active));
        });

        dots.forEach((dot, i) => {
            const active = i === activeSlide;

            dot.classList.toggle('active', active);
            dot.setAttribute('aria-current', active ? 'true' : 'false');
            dot.setAttribute('aria-label', `Show featured item ${i + 1}`);
        });
    };

    const stopRotation = () => {
        if (rotationTimer !== null) {
            window.clearInterval(rotationTimer);
        }

        rotationTimer = null;
    };

    const startRotation = () => {
        stopRotation();

        if (!paused && !document.hidden && featuredSlides.length > 1) {
            rotationTimer = window.setInterval(() => {
                showSlide(activeSlide + 1);
            }, 6500);
        }
    };

    const navigateTo = index => {
        showSlide(index);
        startRotation();
    };

    previous?.addEventListener('click', () => navigateTo(activeSlide - 1));
    next?.addEventListener('click', () => navigateTo(activeSlide + 1));

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => navigateTo(i));
    });

    pause?.addEventListener('click', () => {
        paused = !paused;
        updatePauseControl();
        startRotation();
    });

    controls?.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            navigateTo(activeSlide - 1);
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            navigateTo(activeSlide + 1);
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopRotation();
        } else {
            startRotation();
        }
    });

    showSlide(activeSlide);
    updatePauseControl();
    startRotation();
}

document.querySelectorAll('.carousel-shell').forEach(shell => {
    const track = shell.querySelector('.horizontal-track');
    const previous = shell.querySelector('.row-prev');
    const next = shell.querySelector('.row-next');

    const scrollAmount = () => Math.max(240, track.clientWidth * 0.75);

    previous?.addEventListener('click', () => {
        track.scrollBy({
            left: -scrollAmount(),
            behavior: 'smooth'
        });
    });

    next?.addEventListener('click', () => {
        track.scrollBy({
            left: scrollAmount(),
            behavior: 'smooth'
        });
    });
});

(() => {
    const toggle = document.getElementById('themeToggle');

    if (!toggle) return;

    const icon = document.getElementById('dayIcon');
    const label = document.getElementById('dayLabel');
    const storageKey = 'onestop-theme-mode';

    let mode = 'auto';
    let nextThemeTimer = null;

    try {
        const saved = localStorage.getItem(storageKey);

        if (['auto', 'light', 'dark'].includes(saved)) {
            mode = saved;
        }
    } catch (_) {}

    const getTimeBasedTheme = () => {
        const hour = new Date().getHours();

        return hour >= 6 && hour < 18 ? 'light' : 'dark';
    };

    const applyTheme = () => {
        const resolved = mode === 'auto' ? getTimeBasedTheme() : mode;

        document.body.classList.toggle('night-mode', resolved === 'dark');
        document.documentElement.dataset.theme = resolved;
        document.documentElement.dataset.themeMode = mode;

        if (icon) {
            icon.textContent = mode === 'auto'
                ? (resolved === 'dark' ? '☾' : '☼')
                : mode === 'dark' ? '☾' : '☼';
        }

        if (label) {
            label.textContent = mode === 'auto'
                ? `Auto · ${resolved === 'dark' ? 'Night' : 'Day'}`
                : mode === 'dark' ? 'Dark' : 'Light';
        }

        toggle.setAttribute('aria-pressed', String(resolved === 'dark'));

        toggle.setAttribute(
            'aria-label',
            `Appearance: ${mode === 'auto' ? `automatic ${resolved} theme` : mode + ' theme'}. Tap to change mode.`
        );

        toggle.title = mode === 'auto'
            ? `Automatic theme: ${resolved}. Light 6 AM–6 PM, dark 6 PM–6 AM. Tap to change mode.`
            : `Appearance: ${mode}. Tap to cycle modes.`;

        const themeColor = document.querySelector('meta[name="theme-color"]');

        if (themeColor) {
            themeColor.content = resolved === 'dark' ? '#111b18' : '#183b32';
        }

        if (nextThemeTimer) {
            clearTimeout(nextThemeTimer);
        }

        if (mode === 'auto') {
            const now = new Date();
            const next = new Date(now);

            next.setHours(
                now.getHours() < 6 ? 6 : now.getHours() < 18 ? 18 : 30,
                0,
                0,
                0
            );

            nextThemeTimer = setTimeout(
                applyTheme,
                Math.max(1000, next.getTime() - now.getTime() + 1000)
            );
        }
    };

    toggle.addEventListener('click', event => {
        event.preventDefault();

        mode = mode === 'auto'
            ? 'light'
            : mode === 'light' ? 'dark' : 'auto';

        try {
            localStorage.setItem(storageKey, mode);
        } catch (_) {}

        applyTheme();
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && mode === 'auto') {
            applyTheme();
        }
    });

    applyTheme();
})();

(() => {
    const header = document.querySelector('.site-header');

    if (!header) return;

    let previousY = Math.max(0, window.scrollY || 0);
    let ticking = false;

    const threshold = 8;
    const revealZone = 110;

    const updateHeader = () => {
        const currentY = Math.max(0, window.scrollY || 0);
        const delta = currentY - previousY;

        if (currentY <= revealZone) {
            header.classList.remove('header-hidden');
        } else if (delta > threshold) {
            header.classList.add('header-hidden');
        } else if (delta < -threshold) {
            header.classList.remove('header-hidden');
        }

        previousY = currentY;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
})();

(() => {
    if (document.querySelector('.back-to-top')) return;

    const button = document.createElement('button');

    button.className = 'back-to-top';
    button.type = 'button';
    button.setAttribute('aria-label', 'Back to top');
    button.setAttribute('title', 'Back to top');
    button.setAttribute('aria-hidden', 'true');
    button.innerHTML =
        '<span class="top-mark" aria-hidden="true">⌃</span><span class="top-label">TOP</span>';

    document.body.appendChild(button);

    const visibilityThreshold = 280;
    let ticking = false;

    const updateButton = () => {
        const visible = (
            window.scrollY ||
            document.documentElement.scrollTop ||
            0
        ) > visibilityThreshold;

        button.classList.toggle('is-visible', visible);
        button.setAttribute('aria-hidden', String(!visible));
        button.tabIndex = visible ? 0 : -1;

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateButton);
            ticking = true;
        }
    }, { passive: true });

    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth'
        });
    });

    updateButton();
})();