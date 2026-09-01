/* global cy */
import { editorVisible } from '../support'

const visitCSharp = code =>
  cy.visit(`/?l=text%2Fx-csharp&code=${encodeURIComponent(code)}`).then(editorVisible)

describe('Unity C# syntax highlighting', () => {
  it('expands /// into an XML summary block', () => {
    visitCSharp('  //')

    cy.get('.CodeMirror').then(([element]) => {
      element.CodeMirror.setCursor({ line: 0, ch: 4 })
      element.CodeMirror.focus()
    })
    cy.get('.CodeMirror textarea').type('/', { force: true })

    cy.get('.CodeMirror').then(([element]) => {
      expect(element.CodeMirror.getValue()).to.equal('  /// <summary>\n  /// \n  /// </summary>')
      expect(element.CodeMirror.getCursor()).to.include({ line: 1, ch: 6 })
    })
  })

  it('enables Unity highlighting from strong namespace evidence', () => {
    visitCSharp(`using UnityEngine;

public class Player : MonoBehaviour
{
  void Awake()
  {
    GameObject target = GameObject.Find("Target");
    Debug.Log(target.transform.position);
  }
}`)

    cy.contains('.cm-unity-namespace', 'UnityEngine')
    cy.contains('.cm-unity-type', 'MonoBehaviour')
    cy.contains('.cm-unity-type', 'GameObject')
    cy.contains('.cm-unity-method', 'Awake')
    cy.contains('.cm-unity-method', 'Find')
    cy.contains('.cm-unity-member', 'transform')
  })

  it('recognizes short Unity expressions with two API identifiers', () => {
    visitCSharp('Debug.Log(Vector3.zero);')

    cy.contains('.cm-unity-type', 'Debug')
    cy.contains('.cm-unity-method', 'Log')
    cy.contains('.cm-unity-struct', 'Vector3')
    cy.contains('.cm-unity-member', 'zero')
  })

  it('prioritizes Unity C# when language detection is automatic', () => {
    cy.visit(`/?code=${encodeURIComponent('using UnityEngine; Debug.Log(Vector3.zero);')}`)
    editorVisible()

    cy.contains('.cm-unity-namespace', 'UnityEngine')
    cy.contains('.cm-unity-method', 'Log')
  })

  it('keeps ordinary C# in the base mode below the evidence threshold', () => {
    visitCSharp('class Worker { void Update() {} }')

    cy.get('.cm-unity-method').should('not.exist')
    cy.contains('.CodeMirror-code', 'Update')
  })

  it('colors a declared type name like a type, not like a method', () => {
    visitCSharp(`using UnityEngine;

public class MonoSingleton : MonoBehaviour
{
  void Awake() {}
}`)

    cy.contains('.cm-unity-declared-type', 'MonoSingleton')
    cy.contains('.cm-unity-method', 'Awake')
  })

  it('ignores API names inside strings and comments', () => {
    visitCSharp(`class Worker
{
  string message = "GameObject.Find";
  // Debug.Log and MonoBehaviour
}`)

    cy.get('[class*="cm-unity-"]').should('not.exist')
    cy.contains('.cm-string', 'GameObject.Find')
    cy.contains('.cm-comment', 'Debug.Log and MonoBehaviour')
  })

  it('highlights Input System device controls', () => {
    visitCSharp(`using UnityEngine.InputSystem;

public class Mouse : Pointer, IInputStateCallbackReceiver
{
  public ButtonControl leftButton { get; protected set; }

  protected override void FinishSetup()
  {
    leftButton = GetChildControl<ButtonControl>("leftButton");
    clickCount = GetChildControl<IntegerControl>("clickCount");
  }
}`)

    cy.contains('.cm-unity-member', 'leftButton')
    cy.contains('.cm-unity-member', 'clickCount')
    cy.contains('.cm-unity-type', 'Pointer')
    cy.contains('.cm-unity-type', 'ButtonControl')
    cy.contains('.cm-unity-type', 'IntegerControl')
    cy.contains('.cm-unity-type', 'IInputStateCallbackReceiver')
    cy.contains('.cm-unity-method', 'GetChildControl')
    cy.contains('.cm-unity-method', 'FinishSetup')
  })

  it('highlights Keyboard controls and Key enum values', () => {
    visitCSharp(`using UnityEngine.InputSystem;

public class Typing : MonoBehaviour
{
  void Update()
  {
    if (Keyboard.current.leftShiftKey.isPressed && Keyboard.current.f5Key.wasPressedThisFrame)
      Keyboard.current.OnTextInput('x');
  }
}`)

    cy.contains('.cm-unity-member', 'leftShiftKey')
    cy.contains('.cm-unity-member', 'f5Key')
    cy.contains('.cm-unity-method', 'OnTextInput')
  })

  it('highlights Pointer controls and their layout attribute', () => {
    visitCSharp(`using UnityEngine.InputSystem;

[InputControlLayout(stateType = typeof(PointerState), isGenericTypeOfDevice = true)]
public class Pointer : InputDevice, IInputStateCallbackReceiver
{
  public Vector2Control position { get; protected set; }
  public DeltaControl delta { get; protected set; }
  public AxisControl pressure { get; protected set; }
  public ButtonControl press { get; protected set; }
  public IntegerControl displayIndex { get; protected set; }
}`)

    cy.contains('.cm-unity-struct', 'PointerState')
    cy.contains('.cm-unity-type', 'Vector2Control')
    cy.contains('.cm-unity-type', 'AxisControl')
    cy.contains('.cm-unity-member', 'pressure')
    cy.contains('.cm-unity-member', 'displayIndex')
    cy.contains('.cm-unity-member', 'stateType')
  })

  it('highlights control layout attribute arguments', () => {
    visitCSharp(`using UnityEngine.InputSystem.Layouts;
using UnityEngine.Scripting;

[Preserve]
public class DeltaControl : Vector2Control
{
  [InputControl(useStateFrom = "y", synthetic = true, displayName = "Up")]
  public AxisControl up { get; set; }

  [InputControl(useStateFrom = "x", parameters = "clamp=1", displayName = "Left")]
  public AxisControl left { get; set; }
}`)

    cy.contains('.cm-unity-type', 'Preserve')
    cy.contains('.cm-unity-type', 'Vector2Control')
    cy.contains('.cm-unity-member', 'useStateFrom')
    cy.contains('.cm-unity-member', 'parameters')
    cy.contains('.cm-unity-member', 'synthetic')
    cy.contains('.cm-unity-member', 'left')
  })

  it('colors namespace segments even when they are not Unity APIs', () => {
    visitCSharp(`using UnityEngine;
using UnityEngine.InputSystem;

namespace nanali.foreset.core
{
  public class MonoSingleton : MonoBehaviour
  {
    private void Update()
    {
      if (Touchscreen.current.delta.x.scale)
        Debug.Log("Arrow");
    }
  }
}`)

    cy.contains('.cm-unity-namespace', 'nanali')
    cy.contains('.cm-unity-namespace', 'foreset')
    cy.contains('.cm-unity-namespace', 'core')
    cy.contains('.cm-unity-namespace', 'UnityEngine')
    cy.contains('.cm-unity-declared-type', 'MonoSingleton')
    cy.contains('.cm-unity-type', 'Touchscreen')
  })

  it('highlights scripting lifecycle attributes', () => {
    visitCSharp(`using Unity.Scripting.LifecycleManagement;

public class MonoSingleton : MonoBehaviour
{
  [OnCodeLoaded]
  private void AA() {}

  [AutoStaticsCleanup]
  private static void BB() {}
}`)

    cy.contains('.cm-unity-namespace', 'LifecycleManagement')
    cy.contains('.cm-unity-type', 'OnCodeLoaded')
    cy.contains('.cm-unity-type', 'AutoStaticsCleanup')
  })

  it('colors generics, constraints and atoms like Rider does', () => {
    visitCSharp(`using UnityEngine;

public abstract class MonoSingleton<T> : MonoBehaviour where T : MonoSingleton<T>
{
  private static T _instance;

  protected virtual void Awake()
  {
    if (_instance != null && _instance != this)
      Destroy(gameObject);
  }
}`)

    cy.contains('.cm-keyword', 'where')
    cy.contains('.cm-atom', 'null')
    cy.contains('.cm-unity-declared-type', 'T')
    cy.get('.cm-unity-declared-type').contains('MonoSingleton')
  })

  it('colors fields named by the usual C# and Unity conventions', () => {
    visitCSharp(`using UnityEngine;

public class Singleton : MonoBehaviour
{
  private static Singleton _instance;
  internal static Mouse s_Device;
  private const int k_Limit = 8;
  private int[] m_Keys;

  private void Awake()
  {
    if (_instance != null)
      Destroy(gameObject);
  }
}`)

    cy.get('.cm-unity-member').contains('_instance')
    cy.get('.cm-unity-member').contains('s_Device')
    cy.get('.cm-unity-member').contains('k_Limit')
    cy.get('.cm-unity-member').contains('m_Keys')
  })

  it('colors property declarations in each of their forms', () => {
    visitCSharp(`using UnityEngine;

public class Probe : MonoBehaviour
{
  public int Anima { get; private set; }
  public Vector3 Offset => transform.position;

  public static Probe Instance
  {
    get { return null; }
  }

  private void Awake()
  {
    var total = 3;
    Destroy(gameObject);
  }
}`)

    cy.get('.cm-unity-member').contains('Anima')
    cy.get('.cm-unity-member').contains('Offset')
    cy.get('.cm-unity-member').contains('Instance')
    // a local is not a member, whatever the surrounding declaration looks like
    cy.get('.cm-unity-member').contains('total').should('not.exist')
  })

  it('colors fields that carry no naming prefix, and their usages', () => {
    visitCSharp(`using UnityEngine;

public class MonoSingleton
{
  private int _speed = 3;
  private static MonoSingleton s_instance;
  public float AttackSpeed;
  public static float MoveSpeed;

  private void Awake()
  {
    var total = 3;
    AttackSpeed = total;
    MoveSpeed = AttackSpeed;
  }
}`)

    cy.get('.cm-unity-member').contains('AttackSpeed')
    cy.get('.cm-unity-member').contains('MoveSpeed')
    cy.get('.cm-unity-member').contains('s_instance')
    // the class name is a type wherever it is used, not only where it is declared
    cy.get('.cm-unity-declared-type').contains('MonoSingleton')
    cy.get('.cm-unity-member').contains('total').should('not.exist')
  })

  it('colors KeyCode values through their enum type', () => {
    visitCSharp(`using UnityEngine;

public class Typing : MonoBehaviour
{
  void Update()
  {
    if (Input.GetKeyDown(KeyCode.Space) || Input.GetKey(KeyCode.LeftShift))
      Debug.Log(KeyCode.A);
  }
}`)

    cy.contains('.cm-unity-enum', 'KeyCode')
    cy.contains('.cm-unity-enum-member', 'Space')
    cy.contains('.cm-unity-enum-member', 'LeftShift')
    // covered by the qualifier, though a bare `A` stays out of the registry
    cy.contains('.cm-unity-enum-member', 'A')
    cy.contains('.cm-unity-method', 'GetKeyDown')
  })

  it('colors a declared enum and every value in its body', () => {
    visitCSharp(`namespace UnityEngine;

public enum KeyCode
{
  None = 0,
  Backspace = 8,
  Alpha0 = 48,
}`)

    cy.contains('.cm-unity-enum', 'KeyCode')
    cy.contains('.cm-unity-enum-member', 'None')
    cy.contains('.cm-unity-enum-member', 'Backspace')
    cy.contains('.cm-unity-enum-member', 'Alpha0')
  })

  it('colors structs apart from classes', () => {
    visitCSharp(`using UnityEngine;

public class Mover : MonoBehaviour
{
  private void Update()
  {
    Vector3 step = Vector3.forward * Time.deltaTime;
    transform.rotation = Quaternion.identity;
  }
}`)
    ;['Vector3', 'Quaternion'].forEach(name => cy.contains('.cm-unity-struct', name))
    ;['MonoBehaviour', 'Time'].forEach(name => cy.contains('.cm-unity-type', name))
    cy.contains('.cm-unity-member', 'deltaTime')
  })

  it('covers every configured Unity package registry', () => {
    visitCSharp(`using UnityEngine;
InputAction action;
TMP_Text label;
CinemachineCamera camera;
ScriptableRendererFeature feature;
AssetReference asset;
LocalizedString localized;
NavMeshSurface surface;
NetworkBehaviour networked;`)
    ;[
      'InputAction',
      'TMP_Text',
      'CinemachineCamera',
      'ScriptableRendererFeature',
      'AssetReference',
      'LocalizedString',
      'NavMeshSurface',
      'NetworkBehaviour',
    ].forEach(type => cy.contains('.cm-unity-type', type))
  })

  it('highlights Rigidbody physics APIs, enums, members, and methods', () => {
    visitCSharp(`namespace UnityEngine;

public class Rigidbody : Component
{
  public Vector3 linearVelocity { get; set; }
  public ForceMode mode { get; set; }
  public RigidbodyConstraints constraints { get; set; }
  public CollisionDetectionMode collisionDetectionMode { get; set; }
  public RigidbodyInterpolation interpolation { get; set; }
  public QueryTriggerInteraction queryTriggerInteraction { get; set; }

  public void MovePosition(Vector3 position);
  public void AddForce(Vector3 force, ForceMode mode = ForceMode.Impulse);
  public bool SweepTest(Vector3 direction, out RaycastHit hitInfo);
}`)

    cy.contains('.cm-unity-namespace', 'UnityEngine')
    cy.contains('.cm-unity-declared-type', 'Rigidbody')
    cy.contains('.cm-unity-type', 'Component')
    cy.contains('.cm-unity-struct', 'Vector3')
    cy.contains('.cm-unity-struct', 'RaycastHit')
    cy.contains('.cm-unity-enum', 'ForceMode')
    cy.contains('.cm-unity-enum', 'RigidbodyConstraints')
    cy.contains('.cm-unity-enum', 'CollisionDetectionMode')
    cy.contains('.cm-unity-enum', 'RigidbodyInterpolation')
    cy.contains('.cm-unity-enum', 'QueryTriggerInteraction')
    cy.contains('.cm-unity-member', 'linearVelocity')
    cy.contains('.cm-unity-method', 'MovePosition')
    cy.contains('.cm-unity-method', 'AddForce')
    cy.contains('.cm-unity-method', 'SweepTest')
    cy.contains('.cm-unity-enum-member', 'Impulse')
  })

  it('highlights declared interfaces and their members', () => {
    visitCSharp(`namespace System.Collections;

public interface IEnumerator
{
  object Current { get; }

  bool MoveNext();

  void Reset();
}`)

    cy.contains('.cm-unity-namespace', 'System')
    cy.contains('.cm-unity-namespace', 'Collections')
    cy.contains('.cm-unity-interface', 'IEnumerator')
    cy.contains('.cm-unity-member', 'Current')
    cy.contains('.cm-unity-method', 'MoveNext')
    cy.contains('.cm-unity-method', 'Reset')
  })

  it('highlights user-defined method declarations and method calls in mint', () => {
    visitCSharp(`using UnityEngine;

public class Enemy : MonoBehaviour
{
  public void Die()
  {
    StartCoroutine(DieRoutine());
  }

  private IEnumerator DieRoutine()
  {
    yield return new WaitForSeconds(1f);

    Destroy(gameObject);
  }
}`)

    cy.contains('.cm-unity-method', 'Die')
    cy.contains('.cm-unity-method', 'StartCoroutine')
    cy.contains('.cm-unity-method', 'DieRoutine')
    cy.contains('.cm-unity-method', 'Destroy')
    cy.contains('.cm-unity-type', 'Enemy')
    cy.contains('.cm-unity-type', 'MonoBehaviour')
    cy.contains('.cm-unity-interface', 'IEnumerator')
    cy.contains('.cm-unity-type', 'WaitForSeconds')
  })

  it('colors delegates, events, and event handlers independently', () => {
    visitCSharp(`using System;
using UnityEngine;

public class Player : MonoBehaviour
{
  public static event Action OnPlayerDied;

  private void OnEnable()
  {
    OnPlayerDied += HandlePlayerDied;
  }

  private void OnDisable()
  {
    OnPlayerDied -= HandlePlayerDied;
  }

  private void HandlePlayerDied() {}
}`)

    cy.contains('.cm-unity-delegate', 'Action').should('have.css', 'color', 'rgb(215, 187, 252)')
    cy.get('.cm-unity-event')
      .filter(':contains("OnPlayerDied")')
      .should('have.length', 3)
      .and('have.css', 'color', 'rgb(222, 144, 183)')
    cy.get('.cm-unity-method')
      .filter(':contains("HandlePlayerDied")')
      .should('have.length', 3)
      .and('have.css', 'color', 'rgb(89, 192, 147)')
  })
})

describe('Reduced language and theme configuration', () => {
  const languages = [
    'Auto',
    'Plain Text',
    'C#',
    'C++',
    'CSS',
    'HTML/XML',
    'Java',
    'JavaScript',
    'JSON',
    'JSX',
    'Kotlin',
    'Swift',
    'TypeScript',
    'TSX',
  ]

  it('shows only the retained languages', () => {
    cy.visit('/')
    editorVisible()
    cy.get('input[placeholder="Auto"]').click()

    cy.get('[data-cy="dropdown-item"]').should('have.length', languages.length)
    languages.forEach(language => cy.contains('[data-cy="dropdown-item"]', language))
    cy.contains('[data-cy="dropdown-item"]', 'Python').should('not.exist')
  })

  it('normalizes a removed language to plain text', () => {
    cy.visit('/?l=python&code=print%28%22hello%22%29')
    editorVisible()

    cy.get('input[placeholder="Plain Text"]').should('exist')
  })

  it('ignores legacy theme and highlight overrides', () => {
    cy.visit('/?t=dracula&highlights=%7B%22background%22%3A%22red%22%7D')
    editorVisible()

    cy.get('[data-cy="themes-container"]').should('not.exist')
    cy.get('.CodeMirror').should('have.css', 'background-color', 'rgb(25, 26, 28)')
  })
})
