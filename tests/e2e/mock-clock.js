const originalDateNow = Date.now;
Date.now = function() { return originalDateNow() - 32400000; }; // Subtract 9 hours
