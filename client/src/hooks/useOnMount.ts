import { useEffect } from 'react';

const useOnMount = (callback) => {
    useEffect(() => {
        // Колбэк сработает один раз после полной отрисовки компонента
        callback();
    }, []); // Пустой массив зависимостей, чтобы хук сработал только один раз
};

export default useOnMount;
