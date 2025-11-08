// Path to the login page (same folder)
const LOGIN_PATH = '/login';

// Helper: wait for transitionend for opacity (fallback uses timeout)
function waitForFadeOut(timeout = 700) {
  return new Promise(resolve => {
    const onEnd = (e) => {
      if (e.propertyName === 'opacity') {
        document.body.removeEventListener('transitionend', onEnd);
        resolve();
      }
    };
    document.body.addEventListener('transitionend', onEnd);

    setTimeout(() => {
      document.body.removeEventListener('transitionend', onEnd);
      resolve();
    }, timeout);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.login-btn, .get-started, .access-btn');
  buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      // Start fade-out animation
      document.body.classList.add('fade-out');

      // Wait for the transition, then redirect
      await waitForFadeOut(700);
      window.location.href = LOGIN_PATH;
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const stickyOffset = header.offsetTop;

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > stickyOffset) {
      header.classList.add("sticky");
    } else {
      header.classList.remove("sticky");
    }
  });
});
