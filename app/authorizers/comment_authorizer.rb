class CommentAuthorizer < ApplicationAuthorizer
  class << self
    def creatable_by?(user)
      true
    end
  end
end
