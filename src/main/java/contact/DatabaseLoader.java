package contact;

import contact.repository.ContactRepository;
import contact.entity.Contact;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;


@Component
public class DatabaseLoader implements CommandLineRunner {

	private final ContactRepository repository;

	@Autowired
	public DatabaseLoader(ContactRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(String... strings) throws Exception {
		this.repository.save(new Contact("Jarmo Kungla", "jarmo@mail.ee", "Test aadress 123"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-123"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-124"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-125"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-126"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-127"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-128"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-129"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-130"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-113"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-423"));
		this.repository.save(new Contact("Henry Kaasik", "henry@mail.ee", "Vahtra 8-623"));
		this.repository.save(new Contact("Jarmo Kungla", "jarmo@mail.ee", "Test aadress 123"));

	}
}