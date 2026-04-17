from beanie import Document, Indexed

class UserModel(Document):

    name =Indexed(str, unique=True)
    email=Indexed(str, unique=True)