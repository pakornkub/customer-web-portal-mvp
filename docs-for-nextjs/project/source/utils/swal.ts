import SwalLib from 'sweetalert2';

const isDarkMode = () => document.documentElement.classList.contains('dark');

const getThemedSwal = () => {
  const dark = isDarkMode();
  return SwalLib.mixin({
    background: dark ? '#0f172a' : '#ffffff',
    color: dark ? '#e2e8f0' : '#0f172a',
    backdrop: dark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(15, 23, 42, 0.3)',
    customClass: { container: 'swal-on-top' }
  });
};

const Swal: Pick<typeof SwalLib, 'fire'> = {
  fire: (...args) => getThemedSwal().fire(...args)
};

export default Swal;
