Authority.configure do |config|

  # USER_METHOD
  # ===========
  # Authority needs the name of a method, available in any controller, which
  # will return the currently logged-in user. (If this varies by controller,
  # just create a common alias.)
  #
  # Default is:
  #
  # config.user_method = :current_user

  # CONTROLLER_ACTION_MAP
  # =====================
  # For a given controller method, what verb must a user be able to do?
  # For example, a user can access 'show' if they 'can_read' the resource.
  #
  # These can be modified on a per-controller basis; see README. This option
  # applies to all controllers.
  #
  # Defaults are as follows:
  #
  # config.controller_action_map = {
  #   :index   => 'read',
  #   :show    => 'read',
  #   :new     => 'create',
  #   :create  => 'create',
  #   :edit    => 'update',
  #   :update  => 'update',
  #   :destroy => 'delete'
  # }

  config.controller_action_map.merge!(
    manage: 'manage',
    # Challenge
    accept: 'accept',
    decline: 'decline',
    # Game
    abort: 'abort',
    opponent_setup: 'opponent_setup_read',
    ply: 'ply_create',
    ply_valid: 'read',
    setup_add: 'setup',
    setup_move: 'setup',
    setup_remove: 'setup',
    setup_complete: 'setup',
    valid_plies: 'read',
    resign: 'resign'
  )

  # ABILITIES
  # =========
  # Teach Authority how to understand the verbs and adjectives in your system. Perhaps you
  # need {:microwave => 'microwavable'}. I'm not saying you do, of course. Stop looking at
  # me like that.
  #
  # Defaults are as follows:
  #
  # config.abilities =  {
  #   :create => 'creatable',
  #   :read   => 'readable',
  #   :update => 'updatable',
  #   :delete => 'deletable'
  # }

  config.abilities.merge!(
    manage: 'managable',
    # Challenge
    accept: 'acceptable',
    decline: 'declinable',
    #Game
    abort: 'abortable',
    opponent_setup_read: 'opponent_setup_readable',
    ply_create: 'ply_creatable',
    resign: 'resignable',
    setup: 'setupable'
  )

  # LOGGER
  # ======
  # If a user tries to perform an unauthorized action, where should we log that fact?
  # Provide a logger object which responds to `.warn(message)`, unless your
  # security_violation_handler calls a different method.
  #
  # Default is:
  #
  # config.logger = Logger.new(STDERR)
  #
  # Some possible settings:
  # config.logger = Rails.logger                     # Log with all your app's other messages
  # config.logger = Logger.new('log/authority.log')  # Use this file
  # config.logger = Logger.new('/dev/null')          # Don't log at all (on a Unix system)

end
