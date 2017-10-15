package contact.entity;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

@Data
@Entity
public class Contact {

    private @Id @GeneratedValue Long id;

    private String name;
    private String email;
    private String address;

    private @Version @JsonIgnore Long version;

    private Contact() {}

    public Contact(String name, String email, String address) {
        this.name = name;
        this.email = email;
        this.address = address;
    }
}
