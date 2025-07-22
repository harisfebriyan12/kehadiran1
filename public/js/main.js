document.addEventListener('DOMContentLoaded', () => {
    const themeSelector = document.getElementById('theme');
    const body = document.body;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.classList.toggle('dark-mode', savedTheme === 'dark');
    themeSelector.value = savedTheme;

    // Theme switcher
    themeSelector.addEventListener('change', () => {
        const selectedTheme = themeSelector.value;
        body.classList.toggle('dark-mode', selectedTheme === 'dark');
        localStorage.setItem('theme', selectedTheme);
    });

    // CRUD actions
    const deleteButtons = document.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Here you would typically make an API call to delete the item
                    Swal.fire(
                        'Deleted!',
                        'The user has been deleted.',
                        'success'
                    )
                }
            })
        });
    });

    const deactivateButtons = document.querySelectorAll('.deactivate');
    deactivateButtons.forEach(button => {
        button.addEventListener('click', () => {
            Swal.fire({
                title: 'Are you sure?',
                text: "The user will be deactivated.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, deactivate it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Here you would typically make an API call to deactivate the item
                    Swal.fire(
                        'Deactivated!',
                        'The user has been deactivated.',
                        'success'
                    )
                }
            })
        });
    });
});
