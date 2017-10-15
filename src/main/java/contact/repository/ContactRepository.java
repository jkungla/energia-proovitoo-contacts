package contact.repository;

import contact.entity.Contact;
import org.springframework.data.repository.PagingAndSortingRepository;


/**
 * Created by jarmodev on 11.10.2017.
 */
public interface ContactRepository extends PagingAndSortingRepository<Contact, Long> {

}