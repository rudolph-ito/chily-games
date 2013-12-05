# Using the whitelist approach, everything besides what is specified is unauthorized
#
# Default authorization
#   Can read everything
#   Cannot create/update/delete
#
# update/delete are aliased to manage by default for ease, overwrite if needed
class ApplicationAuthorizer < Authority::Authorizer

  class << self
    def default(adjective, user)
      false
    end

    def readable_by?(user)
      true
    end
  end

  def managable_by?(user)
    false
  end

  def updatable_by?(user)
    managable_by?(user)
  end

  def deletable_by?(user)
    managable_by?(user)
  end

end
