import React from "react";

function ContactList({ chats, onSelect }) {
  const contacts = Object.keys(chats);

  return (
    <ul className="contact-list">
      {contacts.length === 0 && <p>No contacts yet</p>}
      {contacts.map((num) => (
        <li key={num} onClick={() => onSelect(num)}>
          📞 {num}
        </li>
      ))}
    </ul>
  );
}

export default ContactList;
