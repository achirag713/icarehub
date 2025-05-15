import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [aboutUsModalOpen, setAboutUsModalOpen] = useState(false);
  const [contactUsModalOpen, setContactUsModalOpen] = useState(false);

  const openAboutUsModal = () => setAboutUsModalOpen(true);
  const closeAboutUsModal = () => setAboutUsModalOpen(false);
  const openContactUsModal = () => setContactUsModalOpen(true);
  const closeContactUsModal = () => setContactUsModalOpen(false);

  return (
    <ModalContext.Provider value={{
      aboutUsModalOpen,
      contactUsModalOpen,
      openAboutUsModal,
      closeAboutUsModal,
      openContactUsModal,
      closeContactUsModal
    }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);

export default ModalContext;